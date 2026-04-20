import * as repo from './spec.repository.js'

export const createSpecs = async (productId, specs) => {
    const formatted = specs.map((s) => ({
        product_id: productId,
        key: s.key,
        value: s.value,
    }))

    await repo.createMany(formatted)
}