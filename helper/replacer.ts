export function HReplace(text: string, replaceKey: string[], replaceValue: string[]) {
  let result = text

  for (let i = 0; i < replaceKey.length; i++) {
    result = result.replace(replaceKey[i], replaceValue[i])
  }

  return result
}
