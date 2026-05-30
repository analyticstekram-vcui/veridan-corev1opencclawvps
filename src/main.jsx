import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { cleanupObsoleteLocalDrafts } from '@/lib/obsidianDraftStore'

// On app load: remove only obsolete non-approved localStorage drafts.
// Never deletes approved drafts, audit records, or written file index records.
cleanupObsoleteLocalDrafts()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)