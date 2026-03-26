// Head management is consolidated in router/head-manager.ts
// Re-export for backwards compatibility with render module consumers
export { mergeHeadDescriptors as mergeHeads, updateHead as updateDocumentHead } from '../router/head-manager'
