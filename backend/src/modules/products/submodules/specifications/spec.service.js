import * as repo from './spec.repository.js'

export const createSpecs = async (productId, specs) => {
    if (!Array.isArray(specs) || specs.length === 0) {
        console.log('❌ No valid specs received')
        return
    }

    const formatted = specs.map((s) => ({
        product_id: productId,
        key: s.key,
        value: s.value,
    }))

    await repo.createMany(formatted)
}