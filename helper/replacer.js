export function HReplace(text, replaceKey, replaceValue) {
  let result = text

  for (let i = 0; i < replaceKey.length; i++) {
    result = result.replace(replaceKey[i], replaceValue[i])
  }

  return result
}
