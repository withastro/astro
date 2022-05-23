import { TraceMap } from '@jridgewell/trace-mapping';
import { Position } from 'vscode-languageserver';
import { SourceMapDocumentMapper } from '../../lib/documents';

export class ConsumerDocumentMapper extends SourceMapDocumentMapper {
    constructor(traceMap: TraceMap, sourceUri: string, private nrPrependesLines: number) {
        super(traceMap, sourceUri);
    }

    getOriginalPosition(generatedPosition: Position): Position {
        return super.getOriginalPosition(
            Position.create(
                generatedPosition.line - this.nrPrependesLines,
                generatedPosition.character
            )
        );
    }

    getGeneratedPosition(originalPosition: Position): Position {
        const result = super.getGeneratedPosition(originalPosition);
        result.line += this.nrPrependesLines;
        return result;
    }

    isInGenerated(): boolean {
        // always return true and map outliers case by case
        return true;
    }
}
