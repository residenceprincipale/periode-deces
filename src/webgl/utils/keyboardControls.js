export const CONTINUE_KEY = 'a'
export const QTE_KEYS = ['z', 'e', 'r']

export function matchesKey(event, key) {
	return event.key.toLowerCase() === key.toLowerCase()
}

export function isContinueKey(event) {
	return matchesKey(event, CONTINUE_KEY)
}
