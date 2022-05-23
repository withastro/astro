import { Position, WorkspaceEdit, Range } from 'vscode-languageserver';
import {
    Document,
    mapRangeToOriginal,
    getLineAtPosition,
    offsetAt,
    getNodeIfIsInStartTag,
    isInHTMLTagRange
} from '../../../lib/documents';
import { filterAsync, isNotNullOrUndefined, pathToUrl } from '../../../utils';
import { RenameProvider } from '../../interfaces';
import {
    SnapshotFragment,
    SvelteSnapshotFragment,
    SvelteDocumentSnapshot
} from '../DocumentSnapshot';
import { convertRange } from '../utils';
import { LSAndTSDocResolver } from '../LSAndTSDocResolver';
import ts from 'typescript';
import { uniqWith, isEqual } from 'lodash';
import {
    isComponentAtPosition,
    isAfterSvelte2TsxPropsReturn,
    isNoTextSpanInGeneratedCode,
    SnapshotFragmentMap,
    findContainingNode
} from './utils';
import { LSConfigManager } from '../../../ls-config';
import { isAttributeName, isEventHandler } from '../svelte-ast-utils';

export class RenameProviderImpl implements RenameProvider {
    constructor(
        private readonly lsAndTsDocResolver: LSAndTSDocResolver,
        private readonly configManager: LSConfigManager
    ) {}

    // TODO props written as `export {x as y}` are not supported yet.

    async prepareRename(document: Document, position: Position): Promise<Range | null> {
        const { lang, tsDoc } = await this.getLSAndTSDoc(document);
        const fragment = tsDoc.getFragment();

        const offset = fragment.offsetAt(fragment.getGeneratedPosition(position));
        const renameInfo = this.getRenameInfo(lang, tsDoc, document, position, offset);
        if (!renameInfo) {
            return null;
        }

        return this.mapRangeToOriginal(fragment, renameInfo.triggerSpan);
    }

    async rename(
        document: Document,
        position: Position,
        newName: string
    ): Promise<WorkspaceEdit | null> {
        const { lang, tsDoc } = await this.getLSAndTSDoc(document);
        const fragment = tsDoc.getFragment();

        const offset = fragment.offsetAt(fragment.getGeneratedPosition(position));

        if (!this.getRenameInfo(lang, tsDoc, document, position, offset)) {
            return null;
        }

        const renameLocations = lang.findRenameLocations(
            tsDoc.filePath,
            offset,
            false,
            false,
            true
        );
        if (!renameLocations) {
            return null;
        }

        const docs = new SnapshotFragmentMap(this.lsAndTsDocResolver);
        docs.set(tsDoc.filePath, { fragment, snapshot: tsDoc });
        let convertedRenameLocations: Array<
            ts.RenameLocation & {
                range: Range;
            }
        > = await this.mapAndFilterRenameLocations(renameLocations, docs);

        convertedRenameLocations = this.checkShortHandBindingOrSlotLetLocation(
            lang,
            convertedRenameLocations,
            docs
        );

        const additionalRenameForPropRenameInsideComponentWithProp =
            await this.getAdditionLocationsForRenameOfPropInsideComponentWithProp(
                document,
                tsDoc,
                fragment,
                position,
                convertedRenameLocations,
                docs,
                lang
            );
        const additionalRenamesForPropRenameOutsideComponentWithProp =
            // This is an either-or-situation, don't do both
            additionalRenameForPropRenameInsideComponentWithProp.length > 0
                ? []
                : await this.getAdditionalLocationsForRenameOfPropInsideOtherComponent(
                      convertedRenameLocations,
                      docs,
                      lang
                  );
        convertedRenameLocations = [
            ...convertedRenameLocations,
            ...additionalRenameForPropRenameInsideComponentWithProp,
            ...additionalRenamesForPropRenameOutsideComponentWithProp
        ];

        return unique(
            convertedRenameLocations.filter(
                (loc) => loc.range.start.line >= 0 && loc.range.end.line >= 0
            )
        ).reduce(
            (acc, loc) => {
                const uri = pathToUrl(loc.fileName);
                if (!acc.changes[uri]) {
                    acc.changes[uri] = [];
                }
                acc.changes[uri].push({
                    newText: (loc.prefixText || '') + newName + (loc.suffixText || ''),
                    range: loc.range
                });
                return acc;
            },
            <Required<Pick<WorkspaceEdit, 'changes'>>>{ changes: {} }
        );
    }

    private getRenameInfo(
        lang: ts.LanguageService,
        tsDoc: SvelteDocumentSnapshot,
        doc: Document,
        originalPosition: Position,
        generatedOffset: number
    ): {
        canRename: true;
        kind: ts.ScriptElementKind;
        displayName: string;
        fullDisplayName: string;
        triggerSpan: { start: number; length: number };
    } | null {
        // Don't allow renames in error-state, because then there is no generated svelte2tsx-code
        // and rename cannot work
        if (tsDoc.parserError) {
            return null;
        }

        const renameInfo = lang.getRenameInfo(tsDoc.filePath, generatedOffset, {
            allowRenameOfImportPath: false
        });

        if (
            !renameInfo.canRename ||
            renameInfo.fullDisplayName?.includes('JSX.IntrinsicElements') ||
            (renameInfo.kind === ts.ScriptElementKind.jsxAttribute &&
                !isComponentAtPosition(doc, tsDoc, originalPosition))
        ) {
            return null;
        }

        const svelteNode = tsDoc.svelteNodeAt(originalPosition);
        if (
            this.configManager.getConfig().svelte.useNewTransformation &&
            (isInHTMLTagRange(doc.html, doc.offsetAt(originalPosition)) ||
                isAttributeName(svelteNode, 'Element') ||
                isEventHandler(svelteNode, 'Element'))
        ) {
            return null;
        }

        return renameInfo;
    }

    /**
     * If user renames prop of component A inside component A,
     * we need to handle the rename of the prop of A ourselves.
     * Reason: the rename will do {oldPropName: newPropName}, meaning
     * the rename will not propagate further, so we have to handle
     * the conversion to {newPropName: newPropName} ourselves.
     */
    private async getAdditionLocationsForRenameOfPropInsideComponentWithProp(
        document: Document,
        tsDoc: SvelteDocumentSnapshot,
        fragment: SvelteSnapshotFragment,
        position: Position,
        convertedRenameLocations: Array<ts.RenameLocation & { range: Range }>,
        fragments: SnapshotFragmentMap,
        lang: ts.LanguageService
    ) {
        // First find out if it's really the "rename prop inside component with that prop" case
        // Use original document for that because only there the `export` is present.
        const regex = new RegExp(
            `export\\s+let\\s+${this.getVariableAtPosition(
                tsDoc,
                fragment,
                lang,
                position
            )}($|\\s|;|:)` // ':' for typescript's type operator (`export let bla: boolean`)
        );
        const isRenameInsideComponentWithProp = regex.test(
            getLineAtPosition(position, document.getText())
        );
        if (!isRenameInsideComponentWithProp) {
            return [];
        }
        // We now know that the rename happens at `export let X` -> let's find the corresponding
        // prop rename further below in the document.
        const updatePropLocation = this.findLocationWhichWantsToUpdatePropName(
            convertedRenameLocations,
            fragments
        );
        if (!updatePropLocation) {
            return [];
        }
        // Typescript does a rename of `oldPropName: newPropName` -> find oldPropName and rename that, too.
        const idxOfOldPropName = fragment.text.lastIndexOf(':', updatePropLocation.textSpan.start);
        // This requires svelte2tsx to have the properties written down like `return props: {bla: bla}`.
        // It would not work for `return props: {bla}` because then typescript would do a rename of `{bla: renamed}`,
        // so other locations would not be affected.
        const replacementsForProp = (
            lang.findRenameLocations(updatePropLocation.fileName, idxOfOldPropName, false, false) ||
            []
        ).filter(
            (rename) =>
                // filter out all renames inside the component except the prop rename,
                // because the others were done before and then would show up twice, making a wrong rename.
                rename.fileName !== updatePropLocation.fileName ||
                this.isInSvelte2TsxPropLine(fragment, rename)
        );
        return await this.mapAndFilterRenameLocations(replacementsForProp, fragments);
    }

    /**
     * If user renames prop of component A inside component B,
     * we need to handle the rename of the prop of A ourselves.
     * Reason: the rename will rename the prop in the computed svelte2tsx code,
     * but not the `export let X` code in the original because the
     * rename does not propagate further than the prop.
     * This additional logic/propagation is done in this method.
     */
    private async getAdditionalLocationsForRenameOfPropInsideOtherComponent(
        convertedRenameLocations: Array<ts.RenameLocation & { range: Range }>,
        fragments: SnapshotFragmentMap,
        lang: ts.LanguageService
    ) {
        // Check if it's a prop rename
        const updatePropLocation = this.findLocationWhichWantsToUpdatePropName(
            convertedRenameLocations,
            fragments
        );
        if (!updatePropLocation) {
            return [];
        }
        // Find generated `export let`
        const doc = <SvelteSnapshotFragment>fragments.getFragment(updatePropLocation.fileName);
        const match = this.matchGeneratedExportLet(doc, updatePropLocation);
        if (!match) {
            return [];
        }
        // Use match to replace that let, too.
        const idx = (match.index || 0) + match[0].lastIndexOf(match[1]);
        const replacementsForProp =
            lang.findRenameLocations(updatePropLocation.fileName, idx, false, false) || [];

        return this.checkShortHandBindingOrSlotLetLocation(
            lang,
            await this.mapAndFilterRenameLocations(replacementsForProp, fragments),
            fragments
        );
    }

    // --------> svelte2tsx?
    private matchGeneratedExportLet(
        fragment: SvelteSnapshotFragment,
        updatePropLocation: ts.RenameLocation
    ) {
        const regex = new RegExp(
            // no 'export let', only 'let', because that's what it's translated to in svelte2tsx
            `\\s+let\\s+(${fragment.text.substr(
                updatePropLocation.textSpan.start,
                updatePropLocation.textSpan.length
            )})($|\\s|;|:)`
        );
        const match = fragment.text.match(regex);
        return match;
    }

    private findLocationWhichWantsToUpdatePropName(
        convertedRenameLocations: Array<ts.RenameLocation & { range: Range }>,
        fragments: SnapshotFragmentMap
    ) {
        return convertedRenameLocations.find((loc) => {
            // Props are not in mapped range
            if (loc.range.start.line >= 0 && loc.range.end.line >= 0) {
                return;
            }

            const fragment = fragments.getFragment(loc.fileName);
            // Props are in svelte snapshots only
            if (!(fragment instanceof SvelteSnapshotFragment)) {
                return false;
            }

            return this.isInSvelte2TsxPropLine(fragment, loc);
        });
    }

    // --------> svelte2tsx?
    private isInSvelte2TsxPropLine(fragment: SvelteSnapshotFragment, loc: ts.RenameLocation) {
        return isAfterSvelte2TsxPropsReturn(fragment.text, loc.textSpan.start);
    }

    /**
     * The rename locations the ts language services hands back are relative to the
     * svelte2tsx generated code -> map it back to the original document positions.
     * Some of those positions could be unmapped (line=-1), these are handled elsewhere.
     * Also filter out wrong renames.
     */
    private async mapAndFilterRenameLocations(
        renameLocations: readonly ts.RenameLocation[],
        fragments: SnapshotFragmentMap
    ): Promise<Array<ts.RenameLocation & { range: Range }>> {
        const mappedLocations = await Promise.all(
            renameLocations.map(async (loc) => {
                const { fragment, snapshot } = await fragments.retrieve(loc.fileName);

                if (isNoTextSpanInGeneratedCode(snapshot.getFullText(), loc.textSpan)) {
                    return {
                        ...loc,
                        range: this.mapRangeToOriginal(fragment, loc.textSpan)
                    };
                }
            })
        );
        return this.filterWrongRenameLocations(mappedLocations.filter(isNotNullOrUndefined));
    }

    private filterWrongRenameLocations(
        mappedLocations: Array<ts.RenameLocation & { range: Range }>
    ): Promise<Array<ts.RenameLocation & { range: Range }>> {
        return filterAsync(mappedLocations, async (loc) => {
            const snapshot = await this.getSnapshot(loc.fileName);
            if (!(snapshot instanceof SvelteDocumentSnapshot)) {
                return true;
            }

            const content = snapshot.getText(0, snapshot.getLength());
            // When the user renames a Svelte component, ts will also want to rename
            // `__sveltets_1_instanceOf(TheComponentToRename)` or
            // `__sveltets_1_ensureType(TheComponentToRename,..`. Prevent that.
            // Additionally, we cannot rename the hidden variable containing the store value
            return (
                notPrecededBy('__sveltets_1_instanceOf(') &&
                notPrecededBy('__sveltets_1_ensureType(') && // no longer necessary for new transformation
                notPrecededBy('= __sveltets_1_store_get(')
            );

            function notPrecededBy(str: string) {
                return (
                    content.lastIndexOf(str, loc.textSpan.start) !== loc.textSpan.start - str.length
                );
            }
        });
    }

    private mapRangeToOriginal(doc: SnapshotFragment, textSpan: ts.TextSpan): Range {
        // We need to work around a current svelte2tsx limitation: Replacements and
        // source mapping is done in such a way that sometimes the end of the range is unmapped
        // and the index of the last character is returned instead (which is one less).
        // Most of the time this is not much of a problem, but in the context of renaming, it is.
        // We work around that by adding +1 to the end, if necessary.
        // This can be done because
        // 1. we know renames can only ever occur in one line
        // 2. the generated svelte2tsx code will not modify variable names, so we know
        //    the original range should be the same length as the textSpan's length
        const range = mapRangeToOriginal(doc, convertRange(doc, textSpan));
        if (range.end.character - range.start.character < textSpan.length) {
            range.end.character++;
        }
        return range;
    }

    private getVariableAtPosition(
        tsDoc: SvelteDocumentSnapshot,
        fragment: SvelteSnapshotFragment,
        lang: ts.LanguageService,
        position: Position
    ) {
        const offset = fragment.offsetAt(fragment.getGeneratedPosition(position));
        const { start, length } = lang.getSmartSelectionRange(tsDoc.filePath, offset).textSpan;
        return tsDoc.getText(start, start + length);
    }

    private async getLSAndTSDoc(document: Document) {
        return this.lsAndTsDocResolver.getLSAndTSDoc(document);
    }

    private getSnapshot(filePath: string) {
        return this.lsAndTsDocResolver.getSnapshot(filePath);
    }

    private checkShortHandBindingOrSlotLetLocation(
        lang: ts.LanguageService,
        renameLocations: Array<ts.RenameLocation & { range: Range }>,
        fragments: SnapshotFragmentMap
    ): Array<ts.RenameLocation & { range: Range }> {
        const bind = 'bind:';

        return renameLocations.map((location) => {
            const sourceFile = lang.getProgram()?.getSourceFile(location.fileName);

            if (
                !sourceFile ||
                location.fileName !== sourceFile.fileName ||
                location.range.start.line < 0 ||
                location.range.end.line < 0
            ) {
                return location;
            }

            const fragment = fragments.getFragment(location.fileName);
            if (!(fragment instanceof SvelteSnapshotFragment)) {
                return location;
            }

            const { originalText, parent } = fragment;

            if (this.configManager.getConfig().svelte.useNewTransformation) {
                let prefixText = location.prefixText?.trimRight();
                if (!prefixText || prefixText.slice(-1) !== ':') {
                    return location;
                }
                // prefix is of the form `oldVarName: ` -> hints at a shorthand
                let rangeStart = parent.offsetAt(location.range.start);
                // we need to make sure we only adjust shorthands on elements/components
                if (
                    !getNodeIfIsInStartTag(parent.html, rangeStart) ||
                    // shorthands: let:xx, bind:xx, {xx}
                    (parent.getText().charAt(rangeStart - 1) !== ':' &&
                        // not use:action={{foo}}
                        !/[^{]\s+{$/.test(parent.getText().substring(0, rangeStart)))
                ) {
                    return location;
                }
                prefixText = prefixText.slice(0, -1) + '={';
                location = {
                    ...location,
                    prefixText,
                    suffixText: '}'
                };
                // rename range needs to be adjusted in case of an attribute shortand
                if (originalText.charAt(rangeStart - 1) === '{') {
                    rangeStart--;
                    const rangeEnd = parent.offsetAt(location.range.end) + 1;
                    location.range = {
                        start: parent.positionAt(rangeStart),
                        end: parent.positionAt(rangeEnd)
                    };
                }
                return location;
            }

            const renamingInfo =
                this.getShorthandPropInfo(sourceFile, location) ??
                this.getSlotLetInfo(sourceFile, location);

            if (!renamingInfo) {
                return location;
            }

            const [renamingNode, identifierName] = renamingInfo;

            const originalStart = offsetAt(location.range.start, originalText);

            const isShortHandBinding =
                originalText.substr(originalStart - bind.length, bind.length) === bind;

            const directiveName = (isShortHandBinding ? bind : '') + identifierName;
            const prefixText = directiveName + '={';

            const newRange = mapRangeToOriginal(
                fragment,
                convertRange(fragment, {
                    start: renamingNode.getStart(),
                    length: renamingNode.getWidth()
                })
            );

            // somehow the mapping is one character before
            if (
                isShortHandBinding ||
                originalText
                    .substring(offsetAt(newRange.start, originalText), originalStart)
                    .trimLeft() === '{'
            ) {
                newRange.start.character++;
            }

            return {
                ...location,
                prefixText,
                suffixText: '}',
                range: newRange
            };
        });
    }

    /**
     * In case of using JSX, it's not possible to write shorthands like `{foo}`, they are transformed
     * to `foo={foo}` and need extra handling for renaming.
     *
     * In case of `useNewTransformation` - do nothing, as the property is already written in shorthand.
     */
    private getShorthandPropInfo(
        sourceFile: ts.SourceFile,
        location: ts.RenameLocation
    ): [ts.Node, string] | null {
        const possibleJsxAttribute = findContainingNode(
            sourceFile,
            location.textSpan,
            ts.isJsxAttribute
        );
        if (!possibleJsxAttribute) {
            return null;
        }

        const attributeName = possibleJsxAttribute.name.getText();
        const { initializer } = possibleJsxAttribute;

        // not props={props}
        if (
            !initializer ||
            !ts.isJsxExpression(initializer) ||
            attributeName !== initializer.expression?.getText()
        ) {
            return null;
        }

        return [possibleJsxAttribute, attributeName];
    }

    private getSlotLetInfo(
        sourceFile: ts.SourceFile,
        location: ts.RenameLocation
    ): [ts.Node, string] | null {
        const possibleSlotLet = findContainingNode(
            sourceFile,
            location.textSpan,
            ts.isVariableDeclaration
        );
        if (!possibleSlotLet || !ts.isObjectBindingPattern(possibleSlotLet.name)) {
            return null;
        }

        const bindingElement = findContainingNode(
            possibleSlotLet.name,
            location.textSpan,
            ts.isBindingElement
        );

        if (!bindingElement || bindingElement.propertyName) {
            return null;
        }

        const identifierName = bindingElement.name.getText();

        return [bindingElement, identifierName];
    }
}

function unique<T>(array: T[]): T[] {
    return uniqWith(array, isEqual);
}
