export const stringStrategyHandler: StrategyHandler<string> = ({
  code,
  name,
  endOfLocalName,
}) => {
  const expr = `^export\\sconst\\s${name}\\s?=\\s?['"\`](.*)['"\`]`
  const regExp = new RegExp(expr, 'gm')
  const [_, match] = regExp.exec(code)

  if (!match?.length) {
    throw new AstroError({
      ...AstroErrorData.InvalidStaticExport,
      message: AstroErrorData.InvalidStaticExport.message(
        prefix,
        suffix,
        isHybridOutput
      ),
      location: { file: id },
    })
  }

  return match
}
