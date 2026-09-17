import addMaterialDebug from 'utils/addMaterialDebug.js'
import useTransformControls from 'utils/useTransformControls.js'
import { applyObjectSettings } from 'utils/transformSettings.js'

export default function addObjectDebug(folder, object, options = {}) {
	if (!folder?.addFolder) return

	const title = options.title || object.name || object.uuid.slice(0, 8)
	const settings = options.settings
	const debugFolder = folder.addFolder(title)

	if (options.expanded === false) debugFolder.close()
	if (settings) applyObjectSettings(object, settings)

	new useTransformControls(object, debugFolder, undefined, settings)

	if (object.target) {
		new useTransformControls(object.target, debugFolder, 'transform control target')
	}

	const materials = new Set()
	object.traverse((child) => {
		const material = child.material
		if (!material) return
		const list = Array.isArray(material) ? material : [material]
		list.forEach((item) => materials.add(item))
	})

	materials.forEach((material) => {
		addMaterialDebug(debugFolder, material, {
			title: material.name || `${material.uuid.slice(0, 8)}`,
			uniforms: material.userData.debugUniforms,
		})
	})

	return debugFolder
}
