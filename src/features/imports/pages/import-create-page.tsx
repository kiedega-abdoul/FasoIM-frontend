import { useEffect,useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { Card,CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/features/accounts/components"
import { sessionsApi } from "@/features/sessions/api"
import { getApiErrorMessage } from "@/api/api-error"
import { importsApi } from "../api"
import { SOURCE_LABELS } from "../labels"
import type { ImmersionSession } from "@/features/sessions/types"
import type { ImportSource } from "../types"

export function ImportCreatePage(){const nav=useNavigate();const[sessions,setSessions]=useState<ImmersionSession[]>([]);const[session,setSession]=useState("");const[source,setSource]=useState<ImportSource>("BAC");const[file,setFile]=useState<File|null>(null);const[comment,setComment]=useState("");const[busy,setBusy]=useState(false)
useEffect(()=>{sessionsApi.sessions().then(setSessions).catch(e=>toast.error(getApiErrorMessage(e)))},[])
async function submit(force=false){if(!session||!file){toast.error("Choisissez une session et un fichier.");return}setBusy(true);try{const created=await importsApi.create({session:Number(session),type_source:source,fichier:file,commentaire:comment,continuer_malgre_doublon:force});toast.success("Import créé. Lecture du fichier lancée.");nav(`/app/imports/${created.id}`)}catch(e){const data=axios.isAxiosError(e)?e.response?.data:null;const duplicate=JSON.stringify(data).includes("FICHIER_DEJA_IMPORTE");if(duplicate&&!force&&window.confirm("Ce fichier a déjà été importé pour cette session. Continuer quand même ?")){setBusy(false);await submit(true);return}toast.error(getApiErrorMessage(e))}finally{setBusy(false)}}
return <><PageHeader title="Nouvel import officiel" description="Le fichier est d’abord analysé et validé. Aucun immergé n’est créé avant la confirmation finale." backTo="/app/imports"/><Card><CardContent className="space-y-5 p-6"><div className="grid gap-5 md:grid-cols-2"><div><Label>Session</Label><select className="mt-2 h-12 w-full rounded-xl border bg-background px-3" value={session} onChange={e=>setSession(e.target.value)}><option value="">Choisir une session</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.nom} ({s.code})</option>)}</select></div><div><Label>Type de liste</Label><select className="mt-2 h-12 w-full rounded-xl border bg-background px-3" value={source} onChange={e=>setSource(e.target.value as ImportSource)}>{Object.entries(SOURCE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div></div><div><Label>Fichier Excel ou CSV</Label><Input className="mt-2 h-12" type="file" accept=".xlsx,.xls,.csv" onChange={e=>setFile(e.target.files?.[0]??null)}/><p className="mt-2 text-sm text-muted-foreground">Le type de source doit être compatible avec la session choisie.</p></div><div><Label>Commentaire</Label><textarea className="mt-2 min-h-28 w-full rounded-xl border bg-background p-3" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Précision sur l’origine ou le contenu du fichier"/></div><div className="flex justify-end"><Button disabled={busy} onClick={()=>void submit()}>{busy?"Envoi…":"Téléverser et analyser"}</Button></div></CardContent></Card></>}
