export default function addMaterialDebug(folder, material, options = {}) {
	if (!folder?.addFolder || !material) return

	const title = options.title || material.name || material.uuid || 'Material'
	const gui = folder.addFolder(title)
	const uniforms = options.uniforms || material.userData.debugUniforms

	if (uniforms) {
		for (const [name, node] of Object.entries(uniforms)) {
			if (node?.value === undefined) continue
			gui.add(node, 'value').name(name)
		}
		return gui
	}

	if (typeof material.opacity === 'number') {
		gui.add(material, 'opacity', 0, 1, 0.01)
	}

	return gui
}
