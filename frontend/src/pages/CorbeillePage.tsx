import { useState } from "react"
import AppShell from "../components/AppShell"
import { useCorbeille } from "../hooks/useCorbeille"
import { useRestaurerDocument } from "../hooks/useRestaurerDocument"
import { useDeleteDefinitif } from "../hooks/useDeleteDefinitif"
import { useViderCorbeille } from "../hooks/useViderCorbeille"

const SIZE = 20

const TYPE_ICONS: Record<string, string> = {
  pdf:  "picture_as_pdf",
  docx: "description",
  txt:  "article",
  md:   "code_blocks",
}

const TYPE_BARS: Record<string, string> = {
  pdf:  "bg-type-pdf",
  docx: "bg-type-docx",
  txt:  "bg-type-txt",
  md:   "bg-type-md",
}

function CorbeillePage() {
  const [page, setPage] = useState(1)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { documents, total, isLoading } = useCorbeille(page, SIZE)
  const { mutate: restaurer, isPending: isRestoring } = useRestaurerDocument()
  const { mutate: deleteDefinitif, isPending: isDeleting } = useDeleteDefinitif()
  const { mutate: viderCorbeille, isPending: isEmptying } = useViderCorbeille()

  const totalPages = Math.max(1, Math.ceil(total / SIZE))

  return (
    <AppShell>
      <div className="px-6 pt-5 pb-4 hair-b flex items-end justify-between shrink-0 bg-ink/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-mute mb-1.5">
            <span className="text-soft">Corbeille</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-bright">Corbeille</h1>
          <p className="text-[12px] text-soft mt-1">
            {total} document{total > 1 ? 's' : ''} dans la corbeille
          </p>
        </div>
        {total > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            disabled={isEmptying}
            className="btn-ghost flex items-center gap-1.5 hover:!text-danger disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[14px]">delete_forever</span>
            <span>Vider la corbeille</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="section-label">Chargement…</p>
          </div>
        )}

        {!isLoading && documents.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
            <span className="material-symbols-outlined text-mute text-5xl">delete_outline</span>
            <p className="font-body text-sm text-soft">La corbeille est vide.</p>
            <p className="section-label">Les documents supprimés apparaîtront ici.</p>
          </div>
        )}

        {!isLoading && documents.length > 0 && (
          <div className="px-6 py-4">
            <div className="flex flex-col">
              {documents.map((doc, idx) => {
                const typeIcon = doc.type_fichier ? TYPE_ICONS[doc.type_fichier] ?? "insert_drive_file" : "insert_drive_file"
                const typeBar = doc.type_fichier ? TYPE_BARS[doc.type_fichier] ?? "bg-mute" : "bg-mute"
                return (
                  <div
                    key={doc.id}
                    className={`relative flex items-center gap-3 px-4 py-3 hair-b ${idx % 2 === 0 ? 'row' : 'row-alt'}`}
                  >
                    <div className="w-9 h-9 shrink-0 hair flex items-center justify-center relative">
                      <span className="material-symbols-outlined text-[18px] text-mute">{typeIcon}</span>
                      <span className={`absolute -bottom-[1px] left-0 right-0 h-[2px] ${typeBar} opacity-40`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-soft truncate">{doc.titre}</p>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-[10.5px] text-mute">
                        <span className="uppercase">{doc.type_fichier ?? '—'}</span>
                        {doc.auteur && (
                          <>
                            <span className="text-line2">·</span>
                            <span className="truncate">{doc.auteur}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => restaurer(doc.id)}
                      disabled={isRestoring}
                      className="btn-ghost flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[14px]">restore_from_trash</span>
                      <span>Restaurer</span>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(doc.id)}
                      disabled={isDeleting}
                      className="btn-ghost flex items-center justify-center w-9 h-[30px] hover:!text-danger disabled:opacity-40"
                      title="Supprimer définitivement"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                    </button>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="h-10 hair-t mt-2 flex items-center justify-between">
                <span className="font-mono text-[10.5px] text-mute">
                  {documents.length} sur {total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page <= 1}
                    className="w-7 h-7 flex items-center justify-center text-mute hover:text-bright hair disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                  </button>
                  <span className="font-mono text-[11px] text-soft px-2">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                    className="w-7 h-7 flex items-center justify-center text-bright hair disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {confirmEmpty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmEmpty(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-[420px] bg-panel hair flex flex-col">
            <div className="px-5 py-3 hair-b">
              <div className="section-label">Vider la corbeille</div>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-bright mb-2">
                Supprimer définitivement les {total} document{total > 1 ? 's' : ''} ?
              </p>
              <p className="text-[12px] text-danger">Cette action est irréversible.</p>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setConfirmEmpty(false)} className="btn-ghost">Annuler</button>
                <button
                  onClick={() => viderCorbeille(undefined, { onSuccess: () => setConfirmEmpty(false) })}
                  disabled={isEmptying}
                  className="btn-primary !bg-danger !text-bright disabled:opacity-40"
                >
                  {isEmptying ? '...' : 'Vider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-[420px] bg-panel hair flex flex-col">
            <div className="px-5 py-3 hair-b">
              <div className="section-label">Supprimer définitivement</div>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-bright mb-2">
                Supprimer ce document définitivement ?
              </p>
              <p className="text-[12px] text-danger">Cette action est irréversible.</p>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Annuler</button>
                <button
                  onClick={() => deleteDefinitif(confirmDelete, { onSuccess: () => setConfirmDelete(null) })}
                  disabled={isDeleting}
                  className="btn-primary !bg-danger !text-bright disabled:opacity-40"
                >
                  {isDeleting ? '...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default CorbeillePage
