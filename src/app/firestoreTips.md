1. Helper query to read array of document IDs

Use the helper function below to query an array of document IDs. This is especially useful when you have a many-to-many data model that references IDs from a separate collection.

// Helper: Reads an array of IDs from a collection concurrently
const readIds = async (collection, ids) => {
    const reads = ids.map(id => collection.doc(id).get() );
    const result = await Promise.all(reads);
    return result.map(v => v.data());
}
