const OBJECT_SETTINGS_KEYS = ['visible', 'castShadow', 'receiveShadow']

export function applyTransformSettings(object, settings) {
	if (!settings?.position) return

	object.position.set(settings.position.x, settings.position.y, settings.position.z)
	object.rotation.set(settings.rotation.x, settings.rotation.y, settings.rotation.z)
	object.scale.set(settings.scale.x, settings.scale.y, settings.scale.z)
}

export function applyObjectSettings(object, settings) {
	applyTransformSettings(object, settings)

	for (const key of OBJECT_SETTINGS_KEYS) {
		if (settings[key] !== undefined) object[key] = settings[key]
	}
}

export function syncTransformSettings(object, settings) {
	if (!settings?.position) return

	settings.position.x = object.position.x
	settings.position.y = object.position.y
	settings.position.z = object.position.z

	settings.rotation.x = object.rotation.x
	settings.rotation.y = object.rotation.y
	settings.rotation.z = object.rotation.z

	settings.scale.x = object.scale.x
	settings.scale.y = object.scale.y
	settings.scale.z = object.scale.z
}
