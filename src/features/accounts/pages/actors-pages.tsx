/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { accountsApi } from "../api"
import type { Actor, ActorAssignment } from "../types"
import { ACCOUNT_PERMISSIONS as P } from "../permissions"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "../components"
import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"


type ActorFormState = {
  first_name: string
  last_name: string
  email: string
  telephone: string
  titre: string
  organisation: string
  signature_image: File | null
  cachet_image: File | null
}

const EMPTY_ACTOR_FORM: ActorFormState = {
  first_name: "",
  last_name: "",
  email: "",
  telephone: "",
  titre: "",
  organisation: "",
  signature_image: null,
  cachet_image: null,
}

export function ActorsListPage(){
  const [rows,setRows]=useState<Actor[]>([])
  const [q,setQ]=useState('')
  const [e,setE]=useState('')

  async function load(){
    try{
      setRows(await accountsApi.actors(q?{q}:undefined))
      setE('')
    }catch(x){
      setE(getApiErrorMessage(x))
    }
  }

  useEffect(()=>{void load()},[])

  return <>
    <PageHeader
      title="Gestion des acteurs"
      description="Gérez les comptes des acteurs internes FasoIM."
      backTo="/app"
      actionTo="/app/acteurs/nouveau"
      actionLabel="Créer un acteur"
      actionPermission={P.CREATE_ACTOR}
    />

    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
      <Input
        className="h-12 flex-1 rounded-xl px-4 text-base"
        placeholder="Rechercher un acteur par nom, identifiant ou adresse e-mail"
        value={q}
        onChange={x=>setQ(x.target.value)}
        onKeyDown={x=>{if(x.key==='Enter')void load()}}
      />
      <Button
        className="h-12 rounded-xl px-6 text-sm font-semibold sm:min-w-36"
        onClick={load}
      >
        Rechercher
      </Button>
    </div>

    {e&&<ErrorBox message={e}/>}

    {!e&&rows.length===0
      ? <EmptyState message="Aucun acteur trouvé."/>
      : <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-14 px-5">Acteur</TableHead>
                <TableHead className="h-14 px-5">Organisation</TableHead>
                <TableHead className="h-14 px-5">Statut</TableHead>
                <TableHead className="h-14 px-5"/>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(a=>
                <TableRow key={a.id} className="h-20">
                  <TableCell className="px-5">
                    <p className="font-semibold">{a.nom_complet||a.username}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.email}</p>
                  </TableCell>
                  <TableCell className="px-5">{a.organisation||'—'}</TableCell>
                  <TableCell className="px-5"><StatusBadge value={a.statut}/></TableCell>
                  <TableCell className="px-5 text-right">
                    <PermissionGuard permission={P.VIEW_ACTOR}>
                      <Button
                        render={<Link to={`/app/acteurs/${a.id}`}/>}
                        variant="outline"
                        className="h-10 rounded-xl px-5 font-semibold"
                      >
                        Voir
                      </Button>
                    </PermissionGuard>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
    }
  </>
}
export function ActorFormPage({edit=false}:{edit?:boolean}){
  const {acteurId}=useParams()
  const nav=useNavigate()
  const [f,setF]=useState<ActorFormState>(EMPTY_ACTOR_FORM)
  const [existingImages,setExistingImages]=useState({signature_image:null as string|null, cachet_image:null as string|null})
  const [e,setE]=useState('')
  const [loading,setLoading]=useState(edit)
  const [submitting,setSubmitting]=useState(false)

  useEffect(()=>{
    if(!edit||!acteurId){
      setLoading(false)
      return
    }

    accountsApi.actor(+acteurId)
      .then(a=>{
        setF({
          first_name:a.first_name||'',
          last_name:a.last_name||'',
          email:a.email||'',
          telephone:a.telephone||'',
          titre:a.titre||'',
          organisation:a.organisation||'',
          signature_image:null,
          cachet_image:null,
        })
        setExistingImages({signature_image:a.signature_image, cachet_image:a.cachet_image})
      })
      .catch(x=>setE(getApiErrorMessage(x)))
      .finally(()=>setLoading(false))
  },[edit,acteurId])

  function payload(){
    const data = new FormData()
    data.append("first_name", f.first_name)
    data.append("last_name", f.last_name)
    data.append("email", f.email)
    data.append("telephone", f.telephone)
    data.append("titre", f.titre)
    data.append("organisation", f.organisation)
    if(f.signature_image)data.append("signature_image", f.signature_image)
    if(f.cachet_image)data.append("cachet_image", f.cachet_image)
    return data
  }

  async function submit(x:React.FormEvent){
    x.preventDefault()
    setE('')
    setSubmitting(true)

    try{
      const a=edit&&acteurId
        ? await accountsApi.updateActor(+acteurId,payload())
        : await accountsApi.createActor(payload())

      nav(`/app/acteurs/${a.id}`)
    }catch(y){
      setE(getApiErrorMessage(y))
    }finally{
      setSubmitting(false)
    }
  }

  if(loading)return <Loading/>

  return <>
    <PageHeader
      title={edit?'Modifier un acteur':'Créer un acteur'}
      description={edit
        ? "Mettez à jour les informations du compte acteur."
        : "Renseignez les informations du nouvel acteur interne FasoIM."
      }
      backTo={edit&&acteurId?`/app/acteurs/${acteurId}`:'/app/acteurs'}
    />

    <Card className="overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-8">
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Informations personnelles</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Les champs marqués comme obligatoires doivent être renseignés.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  className="h-12 rounded-xl px-4 text-base"
                  value={f.first_name}
                  onChange={z=>setF(v=>({...v,first_name:z.target.value}))}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  className="h-12 rounded-xl px-4 text-base"
                  value={f.last_name}
                  onChange={z=>setF(v=>({...v,last_name:z.target.value}))}
                  autoComplete="family-name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 rounded-xl px-4 text-base"
                  value={f.email}
                  onChange={z=>setF(v=>({...v,email:z.target.value}))}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  className="h-12 rounded-xl px-4 text-base"
                  value={f.telephone}
                  onChange={z=>setF(v=>({...v,telephone:z.target.value}))}
                  autoComplete="tel"
                  placeholder="+226 XX XX XX XX"
                />
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Informations professionnelles</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ces informations permettent d’identifier la fonction de l’acteur.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre ou fonction</Label>
                <Input
                  id="titre"
                  className="h-12 rounded-xl px-4 text-base"
                  value={f.titre}
                  onChange={z=>setF(v=>({...v,titre:z.target.value}))}
                  placeholder="Ex. Directeur régional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organisation">Organisation</Label>
                <Input
                  id="organisation"
                  className="h-12 rounded-xl px-4 text-base"
                  value={f.organisation}
                  onChange={z=>setF(v=>({...v,organisation:z.target.value}))}
                  placeholder="Ex. DGAS"
                />
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Documents de validation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                À renseigner pour les acteurs qui signent ou valident des documents officiels.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signature_image">Signature</Label>
                <Input
                  id="signature_image"
                  type="file"
                  accept="image/*"
                  className="h-12 rounded-xl px-4 text-base"
                  onChange={z=>setF(v=>({...v,signature_image:z.target.files?.[0]??null}))}
                />
                {existingImages.signature_image&&<a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={existingImages.signature_image} target="_blank" rel="noreferrer">Voir la signature enregistrée</a>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cachet_image">Cachet</Label>
                <Input
                  id="cachet_image"
                  type="file"
                  accept="image/*"
                  className="h-12 rounded-xl px-4 text-base"
                  onChange={z=>setF(v=>({...v,cachet_image:z.target.files?.[0]??null}))}
                />
                {existingImages.cachet_image&&<a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={existingImages.cachet_image} target="_blank" rel="noreferrer">Voir le cachet enregistré</a>}
              </div>
            </div>
          </section>

          {e&&<ErrorBox message={e}/>}

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl px-6 font-semibold"
              onClick={()=>nav(edit&&acteurId?`/app/acteurs/${acteurId}`:'/app/acteurs')}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              className="h-12 rounded-xl px-8 font-semibold"
              disabled={submitting}
            >
              {submitting
                ? "Enregistrement..."
                : edit
                  ? "Enregistrer les modifications"
                  : "Créer l’acteur"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </>
}
export function ActorDetailPage(){
  const {acteurId}=useParams()
  const [a,setA]=useState<Actor|null>(null)
  const [assignments,setAssignments]=useState<ActorAssignment[]>([])
  const [e,setE]=useState('')

  async function load(){
    if(!acteurId)return
    try{
      const actorId=+acteurId
      const [actorData,assignmentRows]=await Promise.all([
        accountsApi.actor(actorId),
        accountsApi.assignments({acteur_id:actorId}),
      ])
      setA(actorData)
      setAssignments(assignmentRows)
      setE('')
    }catch(x){
      setE(getApiErrorMessage(x))
    }
  }

  useEffect(()=>{void load()},[acteurId])

  async function action(type:'disable'|'enable'){
    if(!acteurId)return
    try{
      if(type==='disable')await accountsApi.disableActor(+acteurId)
      else await accountsApi.enableActor(+acteurId)
      await load()
    }catch(x){setE(getApiErrorMessage(x))}
  }

  if(e)return <ErrorBox message={e}/>
  if(!a)return <Loading/>

  return <>
    <PageHeader title={a.nom_complet||a.username} backTo="/app/acteurs"/>

    <Card>
      <CardContent className="grid gap-6 p-7 sm:grid-cols-2">
        {Object.entries({Identifiant:a.username,Email:a.email,Téléphone:a.telephone||'—',Fonction:a.titre||'—',Organisation:a.organisation||'—',Statut:a.statut}).map(([k,v])=><div key={k}><p className="text-sm text-muted-foreground">{k}</p><p className="mt-1 font-semibold">{v}</p></div>)}
        <div><p className="text-sm text-muted-foreground">Signature</p>{a.signature_image?<a className="mt-1 inline-block font-semibold text-primary underline-offset-4 hover:underline" href={a.signature_image} target="_blank" rel="noreferrer">Voir la signature</a>:<p className="mt-1 font-semibold">—</p>}</div>
        <div><p className="text-sm text-muted-foreground">Cachet</p>{a.cachet_image?<a className="mt-1 inline-block font-semibold text-primary underline-offset-4 hover:underline" href={a.cachet_image} target="_blank" rel="noreferrer">Voir le cachet</a>:<p className="mt-1 font-semibold">—</p>}</div>
      </CardContent>
    </Card>

    <div className="mt-5 flex flex-wrap gap-3">
      <PermissionGuard permission={P.UPDATE_ACTOR}><Button render={<Link to={`/app/acteurs/${a.id}/modifier`}/>}>Modifier les informations</Button></PermissionGuard>
      {a.statut==='actif'?<PermissionGuard permission={P.DISABLE_ACTOR}><Button variant="destructive" onClick={()=>action('disable')}>Désactiver le compte</Button></PermissionGuard>:<PermissionGuard permission={P.ENABLE_ACTOR}><Button onClick={()=>action('enable')}>Réactiver le compte</Button></PermissionGuard>}
      <PermissionGuard permission={P.ASSIGN_ACTOR}><Button render={<Link to={`/app/affectations/nouvelle`}/>} variant="outline">Ajouter une affectation</Button></PermissionGuard>
    </div>

    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Affectations</h2>
          <p className="mt-1 text-sm text-muted-foreground">Contextes dans lesquels cette personne peut travailler.</p>
        </div>
      </div>
      {assignments.length===0?<EmptyState message="Aucune affectation pour cette personne."/>:<Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Contexte</TableHead><TableHead>Session</TableHead><TableHead>Statut</TableHead><TableHead/></TableRow></TableHeader><TableBody>{assignments.map(row=><TableRow key={row.id}><TableCell><p className="font-semibold capitalize">{row.niveau_affectation}</p><p className="text-sm text-muted-foreground">{[row.region_nom||row.region_code,row.centre_nom].filter(Boolean).join(' · ')||'—'}</p></TableCell><TableCell>{row.session_nom||'Permanente'}</TableCell><TableCell><StatusBadge value={row.statut}/></TableCell><TableCell className="text-right"><PermissionGuard permission={P.VIEW_ACTOR_ASSIGNMENT}><Button render={<Link to={`/app/affectations/${row.id}`}/>} variant="outline" size="sm">Voir</Button></PermissionGuard></TableCell></TableRow>)}</TableBody></Table></Card>}
    </section>
  </>
}
