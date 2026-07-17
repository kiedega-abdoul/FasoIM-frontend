/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { accountsApi } from "../api"
import type { Actor, ActorAssignment, AssignmentReferences, DirectPermission, Permission, Role, RoleAssignment, RolePermission } from "../types"
import { ACCOUNT_PERMISSIONS as P } from "../permissions"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "../components"
import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table"

export function AssignmentsListPage(){
  const [rows,setRows]=useState<ActorAssignment[]>([])
  const [query,setQuery]=useState('')
  const [e,setE]=useState('')

  useEffect(()=>{
    accountsApi.assignments()
      .then(setRows)
      .catch(x=>setE(getApiErrorMessage(x)))
  },[])

  const filtered=useMemo(()=>{
    const value=query.trim().toLowerCase()
    if(!value)return rows
    return rows.filter(x=>[
      x.acteur.nom_complet,
      x.acteur.username,
      x.acteur.email,
      x.niveau_affectation,
      x.region_nom,
      x.region_code,
      x.centre_nom,
      x.session_nom,
      x.statut,
    ].filter(Boolean).some(item=>String(item).toLowerCase().includes(value)))
  },[rows,query])

  return <>
    <PageHeader
      title="Affectations des acteurs"
      description="Définissez le contexte de travail et les responsabilités de chaque acteur."
      backTo="/app"
      actionTo="/app/affectations/nouvelle"
      actionLabel="Affecter un acteur"
      actionPermission={P.ASSIGN_ACTOR}
    />

    <div className="mb-6">
      <Input
        className="h-12 rounded-xl px-4 text-base"
        placeholder="Rechercher par acteur, contexte, session, région ou centre"
        value={query}
        onChange={x=>setQuery(x.target.value)}
      />
    </div>

    {e&&<ErrorBox message={e}/>}

    {!e&&filtered.length===0
      ? <EmptyState message="Aucune affectation trouvée."/>
      : <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-14 px-5">Acteur</TableHead>
                <TableHead className="h-14 px-5">Contexte autorisé</TableHead>
                <TableHead className="h-14 px-5">Session</TableHead>
                <TableHead className="h-14 px-5">Statut</TableHead>
                <TableHead className="h-14 px-5"/>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(x=>
                <TableRow key={x.id} className="h-20">
                  <TableCell className="px-5">
                    <p className="font-semibold">{x.acteur.nom_complet||x.acteur.username}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{x.acteur.email}</p>
                  </TableCell>
                  <TableCell className="px-5">
                    <p className="font-medium capitalize">{x.niveau_affectation}</p>
                    {(x.region_nom||x.centre_nom)&&
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[x.region_nom,x.centre_nom].filter(Boolean).join(' · ')}
                      </p>
                    }
                  </TableCell>
                  <TableCell className="px-5">{x.session_nom||'Permanente'}</TableCell>
                  <TableCell className="px-5"><StatusBadge value={x.statut}/></TableCell>
                  <TableCell className="px-5 text-right">
                    <Button
                      render={<Link to={`/app/affectations/${x.id}`}/>}
                      variant="outline"
                      className="h-10 rounded-xl px-5 font-semibold"
                    >
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
    }
  </>
}
export function AssignmentCreatePage(){
  const nav=useNavigate()
  const [actors,setActors]=useState<Actor[]>([])
  const [references,setReferences]=useState<AssignmentReferences>({sessions:[],regions:[],centres:[]})
  const [f,setF]=useState({
    acteur_id:'',
    type_duree:'permanente',
    session_id:'',
    niveau_affectation:'national',
    region_code:'',
    centre_id:'',
    date_debut:new Date().toISOString().slice(0,10),
    date_fin:'',
  })
  const [e,setE]=useState('')
  const [loading,setLoading]=useState(true)
  const [submitting,setSubmitting]=useState(false)

  useEffect(()=>{
    Promise.all([accountsApi.actors(),accountsApi.assignmentReferences()])
      .then(([actorsData,referencesData])=>{
        setActors(actorsData)
        setReferences(referencesData)
      })
      .catch(x=>setE(getApiErrorMessage(x)))
      .finally(()=>setLoading(false))
  },[])

  const centresDisponibles=useMemo(
    ()=>references.centres.filter(c=>!f.region_code||c.region_code===f.region_code),
    [references.centres,f.region_code],
  )

  function updateNiveau(niveau:string){
    setF(v=>({
      ...v,
      niveau_affectation:niveau,
      region_code:['region','centre'].includes(niveau)?v.region_code:'',
      centre_id:niveau==='centre'?v.centre_id:'',
    }))
  }

  async function submit(x:React.FormEvent){
    x.preventDefault()
    setE('')

    if(f.type_duree==='session'&&!f.session_id){setE("Sélectionnez une session.");return}
    if(['region','centre'].includes(f.niveau_affectation)&&!f.region_code){setE("Sélectionnez une région.");return}
    if(f.niveau_affectation==='centre'&&!f.centre_id){setE("Sélectionnez un centre.");return}
    if(f.date_fin&&f.date_fin<f.date_debut){setE("La date de fin ne peut pas précéder la date de début.");return}

    setSubmitting(true)
    try{
      const affectation=await accountsApi.createAssignment({
        acteur_id:Number(f.acteur_id),
        session_id:f.type_duree==='session'?Number(f.session_id):null,
        niveau_affectation:f.niveau_affectation,
        region_code:['region','centre'].includes(f.niveau_affectation)?f.region_code:'',
        centre_id:f.niveau_affectation==='centre'?Number(f.centre_id):null,
        date_debut:f.date_debut,
        date_fin:f.date_fin||null,
      })
      nav(`/app/affectations/${affectation.id}`)
    }catch(y){
      setE(getApiErrorMessage(y))
    }finally{
      setSubmitting(false)
    }
  }

  if(loading)return <Loading/>

  return <>
    <PageHeader
      title="Affecter un acteur"
      description="Choisissez la personne, son contexte de travail et la période concernée."
      backTo="/app/affectations"
    />

    <Card className="overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={submit} className="space-y-6">
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Personne et période</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sélectionnez la personne puis indiquez si l’affectation est permanente ou liée à une session.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Personne *">
                <select className="h-12 w-full rounded-xl border bg-background px-4 text-base" value={f.acteur_id} onChange={x=>setF(v=>({...v,acteur_id:x.target.value}))} required>
                  <option value="">Sélectionner une personne</option>
                  {actors.map(a=><option key={a.id} value={a.id}>{a.nom_complet||a.username}{a.email?` · ${a.email}`:''}</option>)}
                </select>
              </Field>
              <Field label="Durée de l’affectation *">
                <select className="h-12 w-full rounded-xl border bg-background px-4 text-base" value={f.type_duree} onChange={x=>setF(v=>({...v,type_duree:x.target.value,session_id:x.target.value==='permanente'?'':v.session_id}))}>
                  <option value="permanente">Permanente</option>
                  <option value="session">Liée à une session</option>
                </select>
              </Field>
              {f.type_duree==='session'&&<div className="sm:col-span-2"><Field label="Session *"><select className="h-12 w-full rounded-xl border bg-background px-4 text-base" value={f.session_id} onChange={x=>setF(v=>({...v,session_id:x.target.value}))} required><option value="">Sélectionner une session</option>{references.sessions.map(s=><option key={s.id} value={s.id}>{s.nom} · {s.code}</option>)}</select></Field></div>}
            </div>
          </section>

          <section className="border-t pt-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Périmètre de travail</h2>
              <p className="mt-1 text-sm text-muted-foreground">Les champs Région et Centre apparaissent uniquement lorsqu’ils sont nécessaires.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Contexte *">
                <select className="h-12 w-full rounded-xl border bg-background px-4 text-base" value={f.niveau_affectation} onChange={x=>updateNiveau(x.target.value)}>
                  <option value="plateforme">Plateforme</option>
                  <option value="national">National</option>
                  <option value="region">Régional</option>
                  <option value="centre">Centre</option>
                </select>
              </Field>
              {['region','centre'].includes(f.niveau_affectation)&&<Field label="Région *"><select className="h-12 w-full rounded-xl border bg-background px-4 text-base" value={f.region_code} onChange={x=>setF(v=>({...v,region_code:x.target.value,centre_id:''}))} required><option value="">Sélectionner une région</option>{references.regions.map(r=><option key={r.id} value={r.code}>{r.nom}</option>)}</select></Field>}
              {f.niveau_affectation==='centre'&&<div className="sm:col-span-2"><Field label="Centre *"><select className="h-12 w-full rounded-xl border bg-background px-4 text-base" value={f.centre_id} onChange={x=>setF(v=>({...v,centre_id:x.target.value}))} required disabled={!f.region_code}><option value="">{f.region_code?'Sélectionner un centre':'Sélectionnez d’abord une région'}</option>{centresDisponibles.map(c=><option key={c.id} value={c.id}>{c.nom} · {c.ville}</option>)}</select></Field></div>}
            </div>
          </section>

          <section className="border-t pt-6">
            <div className="mb-5"><h2 className="text-xl font-semibold">Période</h2></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Date de début *"><Input type="date" className="h-12 rounded-xl px-4 text-base" value={f.date_debut} onChange={x=>setF(v=>({...v,date_debut:x.target.value}))} required/></Field>
              <Field label="Date de fin"><Input type="date" className="h-12 rounded-xl px-4 text-base" value={f.date_fin} min={f.date_debut} onChange={x=>setF(v=>({...v,date_fin:x.target.value}))}/></Field>
            </div>
          </section>

          {e&&<ErrorBox message={e}/>}

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-12 rounded-xl px-6 font-semibold" onClick={()=>nav('/app/affectations')}>Annuler</Button>
            <Button type="submit" className="h-12 rounded-xl px-8 font-semibold" disabled={submitting}>{submitting?'Création...':"Enregistrer l’affectation"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </>
}
export function AssignmentDetailPage(){
  const{id}=useParams();
  const[x,setX]=useState<ActorAssignment|null>(null);
  const[roleRows,setRoleRows]=useState<RoleAssignment[]>([]);
  const[directRows,setDirectRows]=useState<DirectPermission[]>([]);
  const[roles,setRoles]=useState<Role[]>([]);
  const[perms,setPerms]=useState<Permission[]>([]);
  const[roleId,setRoleId]=useState('');
  const[permissionId,setPermissionId]=useState('');
  const[e,setE]=useState('');
  const[actionError,setActionError]=useState('');
  const[actionMessage,setActionMessage]=useState('');
  async function load(){
    if(!id)return;
    try{
      const assignmentId=+id;
      const [assignment,roleAssignments,directPermissions,availableRoles,availablePermissions]=await Promise.all([
        accountsApi.assignment(assignmentId),
        accountsApi.roleAssignments({affectation_acteur_id:assignmentId}),
        accountsApi.directPermissions({affectation_acteur_id:assignmentId}),
        accountsApi.assignableRoles(assignmentId),
        accountsApi.permissions(),
      ]);
      setX(assignment);setRoleRows(roleAssignments);setDirectRows(directPermissions);setRoles(availableRoles);setPerms(availablePermissions);
    }catch(y){setE(getApiErrorMessage(y))}
  }
  useEffect(()=>{void load()},[id]);
  if(e)return<ErrorBox message={e}/>;if(!x)return<Loading/>;
  const assignment=x;
  const isActive=assignment.statut==='active'||assignment.statut==='actif';
  const isSuspended=assignment.statut==='suspendue'||assignment.statut==='suspendu';
  const statusLabel=({active:'Active',actif:'Active',suspendue:'Suspendue',suspendu:'Suspendue',terminee:'Terminée',retiree:'Retirée',retire:'Retirée'} as Record<string,string>)[assignment.statut]||assignment.statut;
  async function runAction(action:()=>Promise<unknown>,success:string){
    setActionError('');setActionMessage('');
    try{await action();setActionMessage(success);await load()}
    catch(y){setActionError(getApiErrorMessage(y))}
  }
  async function assignRole(){
    if(!roleId){setActionError('Choisissez un rôle avant de valider.');return}
    const selected=roles.find(r=>String(r.id)===roleId);
    setActionError('');setActionMessage('');
    try{
      await accountsApi.createRoleAssignment({affectation_acteur_id:assignment.id,role_id:+roleId});
      setRoleId('');
      setActionMessage(selected?`La responsabilité « ${selected.libelle} » a été ajoutée.`:'La responsabilité a été ajoutée.');
      await load();
    }catch(y){setActionError(getApiErrorMessage(y))}
  }
  return <><PageHeader title={`Affectation de ${assignment.acteur.nom_complet||assignment.acteur.username}`} backTo="/app/affectations"/>
    <Card><CardContent className="grid gap-6 p-7 sm:grid-cols-2">{Object.entries({Niveau:assignment.niveau_affectation,Session:assignment.session_nom||'Permanente',Région:assignment.region_nom||assignment.region_code||'—',Centre:assignment.centre_nom||'—',Début:assignment.date_debut,Fin:assignment.date_fin||'—',Statut:statusLabel}).map(([k,v])=><div key={k}><p className="text-sm text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>)}</CardContent></Card>
    <div className="mt-5 flex flex-wrap gap-3">
      {isActive&&<PermissionGuard permission={P.SUSPEND_ACTOR_ASSIGNMENT}><Button variant="outline" onClick={()=>runAction(()=>accountsApi.suspendAssignment(assignment.id),'L’affectation a été suspendue.')}>Suspendre l’affectation</Button></PermissionGuard>}
      {isSuspended&&<PermissionGuard permission={P.ENABLE_ACTOR_ASSIGNMENT}><Button onClick={()=>runAction(()=>accountsApi.enableAssignment(assignment.id),'L’affectation a été réactivée.')}>Réactiver l’affectation</Button></PermissionGuard>}
      <PermissionGuard permission={P.REMOVE_ACTOR_ASSIGNMENT}><Button variant="destructive" onClick={async()=>{setActionError('');try{await accountsApi.removeAssignment(assignment.id);location.assign('/app/affectations')}catch(y){setActionError(getApiErrorMessage(y))}}}>Retirer l’affectation</Button></PermissionGuard>
    </div>
    {actionError&&<div className="mt-4"><ErrorBox message={actionError}/></div>}
    {actionMessage&&<p className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">{actionMessage}</p>}

    <section className="mt-8"><h2 className="text-2xl font-bold">Responsabilités dans cette affectation</h2>
      <p className="mt-1 text-sm text-muted-foreground">Ajoutez la responsabilité que cette personne exercera dans ce contexte.</p>
      <PermissionGuard permission={P.ASSIGN_ROLE}><Card className="my-4"><CardContent className="space-y-4 p-5"><div className="flex gap-3"><select className="h-11 flex-1 rounded-xl border bg-background px-3" value={roleId} onChange={z=>{setRoleId(z.target.value);setActionError('');setActionMessage('')}}><option value="">Choisir une responsabilité à ajouter</option>{roles.map(r=><option key={r.id} value={r.id}>{r.libelle}</option>)}</select><Button onClick={assignRole} disabled={roles.length===0}>Ajouter cette responsabilité</Button></div><p className="text-sm text-muted-foreground">La liste affiche uniquement les responsabilités que vous pouvez ajouter ici.</p></CardContent></Card></PermissionGuard>
      {roleRows.length===0?<EmptyState message="Aucune responsabilité ajoutée pour cette affectation."/>:<Card><Table><TableHeader><TableRow><TableHead>Responsabilité ajoutée</TableHead><TableHead>Fin prévue</TableHead><TableHead/></TableRow></TableHeader><TableBody>{roleRows.map(r=><TableRow key={r.id}><TableCell>{r.role.libelle}</TableCell><TableCell>{r.date_expiration||'Aucune'}</TableCell><TableCell className="text-right"><PermissionGuard permission={P.REMOVE_ROLE}><Button size="sm" variant="destructive" onClick={()=>runAction(()=>accountsApi.removeRoleAssignment(r.id),'La responsabilité a été retirée.')}>Retirer</Button></PermissionGuard></TableCell></TableRow>)}</TableBody></Table></Card>}
    </section>

    <section className="mt-8"><h2 className="text-2xl font-bold">Autorisations particulières</h2>
      <PermissionGuard permission={P.ASSIGN_DIRECT_PERMISSION}><Card className="my-4"><CardContent className="flex gap-3 p-5"><select className="h-11 flex-1 rounded-xl border bg-background px-3" value={permissionId} onChange={z=>setPermissionId(z.target.value)}><option value="">Choisir une autorisation</option>{perms.map(p=><option key={p.id} value={p.id}>{p.module} · {p.libelle}</option>)}</select><Button onClick={async()=>{if(permissionId){await accountsApi.addDirectPermission({affectation_acteur_id:assignment.id,permission_id:+permissionId,motif:'Ajout depuis la fiche de l’affectation'});setPermissionId('');await load()}}}>Attribuer</Button></CardContent></Card></PermissionGuard>
      {directRows.length===0?<EmptyState message="Aucune autorisation particulière."/>:<Card><Table><TableHeader><TableRow><TableHead>Autorisation</TableHead><TableHead>Motif</TableHead><TableHead/></TableRow></TableHeader><TableBody>{directRows.map(r=><TableRow key={r.id}><TableCell>{r.permission.libelle}</TableCell><TableCell>{r.motif||'—'}</TableCell><TableCell className="text-right"><PermissionGuard permission={P.REMOVE_DIRECT_PERMISSION}><Button size="sm" variant="destructive" onClick={async()=>{await accountsApi.removeDirectPermission(r.id);await load()}}>Retirer</Button></PermissionGuard></TableCell></TableRow>)}</TableBody></Table></Card>}
    </section>
  </>
}

export function RolesListPage(){
  const [rows,setRows]=useState<Role[]>([])
  const [query,setQuery]=useState('')
  const [e,setE]=useState('')

  useEffect(()=>{
    accountsApi.roles()
      .then(setRows)
      .catch(x=>setE(getApiErrorMessage(x)))
  },[])

  const perimetreLabel=(value:string)=>({
    plateforme:'Plateforme',
    national:'National',
    region:'Régional',
    centre:'Centre',
  }[value]||value)

  const filtered=useMemo(()=>{
    const value=query.trim().toLowerCase()
    if(!value)return rows
    return rows.filter(role=>[
      role.libelle,
      role.code,
      role.description,
      role.perimetre_autorise,
      role.statut,
    ].filter(Boolean).some(item=>String(item).toLowerCase().includes(value)))
  },[rows,query])

  return <>
    <PageHeader
      title="Rôles et responsabilités"
      description="Préparez les responsabilités qui pourront être données aux acteurs."
      backTo="/app"
      actionTo="/app/roles/nouveau"
      actionLabel="Créer une responsabilité"
      actionPermission={P.CREATE_ROLE}
    />

    <div className="mb-6">
      <Input
        className="h-12 rounded-xl px-4 text-base"
        placeholder="Rechercher par nom, contexte ou description"
        value={query}
        onChange={x=>setQuery(x.target.value)}
      />
    </div>

    {e&&<ErrorBox message={e}/>}

    {!e&&filtered.length===0
      ? <EmptyState message="Aucune responsabilité trouvée."/>
      : <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-14 px-5">Responsabilité</TableHead>
                <TableHead className="h-14 px-5">Contexte autorisé</TableHead>
                <TableHead className="h-14 px-5">Niveau</TableHead>
                <TableHead className="h-14 px-5">Statut</TableHead>
                <TableHead className="h-14 px-5"/>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(role=>
                <TableRow key={role.id} className="h-20">
                  <TableCell className="px-5">
                    <p className="font-semibold">{role.libelle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{role.code}</p>
                  </TableCell>
                  <TableCell className="px-5">{perimetreLabel(role.perimetre_autorise)}</TableCell>
                  <TableCell className="px-5">
                    <p className="font-medium">Niveau {role.niveau}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Plus le nombre est petit, plus le rôle est élevé.</p>
                  </TableCell>
                  <TableCell className="px-5"><StatusBadge value={role.statut}/></TableCell>
                  <TableCell className="px-5 text-right">
                    <Button
                      render={<Link to={`/app/roles/${role.id}`}/>}
                      variant="outline"
                      className="h-10 rounded-xl px-5 font-semibold"
                    >
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
    }
  </>
}
const roleEmpty={libelle:'',description:'',niveau:'50',perimetre_autorise:'centre'}

export function RoleFormPage({edit=false}:{edit?:boolean}){
  const {roleId}=useParams()
  const nav=useNavigate()
  const [f,setF]=useState(roleEmpty)
  const [permissions,setPermissions]=useState<Permission[]>([])
  const [selected,setSelected]=useState<number[]>([])
  const [existingRows,setExistingRows]=useState<RolePermission[]>([])
  const [e,setE]=useState('')
  const [loading,setLoading]=useState(true)
  const [submitting,setSubmitting]=useState(false)

  useEffect(()=>{
    async function load(){
      try{
        const permissionsData=await accountsApi.permissions()
        setPermissions(permissionsData)

        if(edit&&roleId){
          const [role,rows]=await Promise.all([
            accountsApi.role(+roleId),
            accountsApi.rolePermissions({role_id:+roleId}),
          ])
          setF({
            libelle:role.libelle,
            description:role.description||'',
            niveau:String(role.niveau),
            perimetre_autorise:role.perimetre_autorise,
          })
          setExistingRows(rows)
          setSelected(rows.map(row=>row.permission_id))
        }
      }catch(x){
        setE(getApiErrorMessage(x))
      }finally{
        setLoading(false)
      }
    }
    void load()
  },[edit,roleId])

  const modules=useMemo(()=>{
    const grouped=new Map<string,Permission[]>()
    permissions.forEach(permission=>{
      const list=grouped.get(permission.module)||[]
      list.push(permission)
      grouped.set(permission.module,list)
    })
    return [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b))
  },[permissions])

  function togglePermission(id:number){
    setSelected(values=>values.includes(id)
      ? values.filter(value=>value!==id)
      : [...values,id]
    )
  }

  async function syncPermissions(roleIdValue:number){
    const existingIds=new Set(existingRows.map(row=>row.permission_id))
    const selectedIds=new Set(selected)

    for(const permissionId of selected){
      if(!existingIds.has(permissionId)){
        await accountsApi.addRolePermission({
          role_id:roleIdValue,
          permission_id:permissionId,
        })
      }
    }

    for(const row of existingRows){
      if(!selectedIds.has(row.permission_id)){
        await accountsApi.removeRolePermission(row.id)
      }
    }
  }

  async function submit(event:React.FormEvent){
    event.preventDefault()
    setE('')
    setSubmitting(true)

    try{
      const payload={
        ...f,
        niveau:Number(f.niveau),
      }
      const role=edit&&roleId
        ? await accountsApi.updateRole(+roleId,payload)
        : await accountsApi.createRole(payload)

      await syncPermissions(role.id)
      nav(`/app/roles/${role.id}`)
    }catch(x){
      setE(getApiErrorMessage(x))
    }finally{
      setSubmitting(false)
    }
  }

  if(loading)return <Loading/>

  return <>
    <PageHeader
      title={edit?'Modifier la responsabilité':'Créer une responsabilité'}
      description={edit
        ? 'Modifiez les informations et les autorisations de cette responsabilité.'
        : 'Définissez la responsabilité et sélectionnez ses autorisations.'
      }
      backTo={edit&&roleId?`/app/roles/${roleId}`:'/app/roles'}
    />

    <Card className="overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={submit} className="space-y-6">
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Informations générales</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Le nom affiché doit être compréhensible pour les utilisateurs.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Libellé *">
                <Input
                  className="h-12 rounded-xl px-4 text-base"
                  value={f.libelle}
                  onChange={x=>setF(v=>({...v,libelle:x.target.value}))}
                  placeholder="Ex. Responsable logistique"
                  required
                />
              </Field>

              <Field label="Périmètre autorisé *">
                <select
                  className="h-12 w-full rounded-xl border bg-background px-4 text-base"
                  value={f.perimetre_autorise}
                  onChange={x=>setF(v=>({...v,perimetre_autorise:x.target.value}))}
                >
                  <option value="plateforme">Plateforme</option>
                  <option value="national">National</option>
                  <option value="region">Régional</option>
                  <option value="centre">Centre</option>
                </select>
              </Field>

              <Field label="Niveau hiérarchique *">
                <Input
                  type="number"
                  min="0"
                  className="h-12 rounded-xl px-4 text-base"
                  value={f.niveau}
                  onChange={x=>setF(v=>({...v,niveau:x.target.value}))}
                  required
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Plus le nombre est petit, plus le rôle est élevé dans la hiérarchie.
                </p>
              </Field>

              <Field label="Description">
                <textarea
                  className="min-h-32 w-full rounded-xl border bg-background p-4 text-base outline-none focus:ring-2 focus:ring-ring"
                  value={f.description}
                  onChange={x=>setF(v=>({...v,description:x.target.value}))}
                  placeholder="Décrivez les responsabilités principales du rôle."
                />
              </Field>
            </div>
          </section>

          <section className="border-t pt-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Autorisations incluses</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sélectionnez uniquement les actions nécessaires à cette responsabilité.
                </p>
              </div>
              <p className="text-sm font-semibold text-primary">{selected.length} sélectionnée(s)</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {modules.map(([module,modulePermissions])=>
                <div key={module} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold capitalize">{module}</h3>
                    <span className="text-xs text-muted-foreground">
                      {modulePermissions.filter(permission=>selected.includes(permission.id)).length}/{modulePermissions.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {modulePermissions.map(permission=>
                      <label
                        key={permission.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-3 transition hover:border-primary/40"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 size-4 accent-primary"
                          checked={selected.includes(permission.id)}
                          onChange={()=>togglePermission(permission.id)}
                        />
                        <span>
                          <span className="block text-sm font-medium">{permission.libelle}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{permission.code}</span>
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {e&&<ErrorBox message={e}/>}

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl px-6 font-semibold"
              onClick={()=>nav(edit&&roleId?`/app/roles/${roleId}`:'/app/roles')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="h-12 rounded-xl px-8 font-semibold"
              disabled={submitting}
            >
              {submitting
                ? 'Enregistrement...'
                : edit
                  ? 'Enregistrer les modifications'
                  : 'Créer la responsabilité'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </>
}
export function RoleDetailPage(){const{roleId}=useParams();const[r,setR]=useState<Role|null>(null);useEffect(()=>{if(roleId)accountsApi.role(+roleId).then(setR)},[roleId]);if(!r)return<Loading/>;return <><PageHeader title={r.libelle} backTo="/app/roles"/><Card><CardContent className="grid gap-6 p-7 sm:grid-cols-2">{Object.entries({Code:r.code,Description:r.description||'—',Niveau:r.niveau,Périmètre:r.perimetre_autorise,Statut:r.statut,'Rôle système':r.est_systeme?'Oui':'Non'}).map(([k,v])=><div key={k}><p className="text-sm text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>)}</CardContent></Card><div className="mt-5 flex gap-3"><PermissionGuard permission={P.UPDATE_ROLE}><Button render={<Link to={`/app/roles/${r.id}/modifier`}/>}>Modifier</Button></PermissionGuard><PermissionGuard permission={P.VIEW_ROLE}><Button render={<Link to={`/app/roles/${r.id}/permissions`}/>} variant="outline">Autorisations incluses</Button></PermissionGuard><PermissionGuard permission={P.DISABLE_ROLE}><Button variant="destructive" onClick={()=>accountsApi.disableRole(r.id).then(()=>location.reload())}>Désactiver</Button></PermissionGuard></div></>}
export function RolePermissionsPage(){const{roleId}=useParams();const[rows,setRows]=useState<RolePermission[]>([]);const[perms,setPerms]=useState<Permission[]>([]);const[selected,setSelected]=useState('');async function load(){if(!roleId)return;setRows(await accountsApi.rolePermissions({role_id:+roleId}));setPerms(await accountsApi.permissions())}useEffect(()=>{void load()},[roleId]);return <><PageHeader title="Autorisations incluses" backTo={`/app/roles/${roleId}`}/><PermissionGuard permission={P.ADD_ROLE_PERMISSION}><Card className="mb-5"><CardContent className="flex gap-3 p-5"><select className="h-11 flex-1 rounded-xl border bg-background px-3" value={selected} onChange={x=>setSelected(x.target.value)}><option value="">Choisir une autorisation</option>{perms.map(p=><option key={p.id} value={p.id}>{p.module} · {p.libelle}</option>)}</select><Button onClick={async()=>{if(roleId&&selected){await accountsApi.addRolePermission({role_id:+roleId,permission_id:+selected});setSelected('');await load()}}}>Ajouter</Button></CardContent></Card></PermissionGuard>{rows.length===0?<EmptyState message="Aucune autorisation ajoutée."/>:<Card><Table><TableHeader><TableRow><TableHead>Autorisation</TableHead><TableHead>Délégable</TableHead><TableHead/></TableRow></TableHeader><TableBody>{rows.map(x=><TableRow key={x.id}><TableCell>{x.permission_libelle}<p className="text-sm text-muted-foreground">{x.permission_code}</p></TableCell><TableCell>{x.est_delegable?'Oui':'Non'}</TableCell><TableCell><PermissionGuard permission={P.REMOVE_ROLE_PERMISSION}><Button variant="destructive" size="sm" onClick={async()=>{await accountsApi.removeRolePermission(x.id);await load()}}>Retirer</Button></PermissionGuard></TableCell></TableRow>)}</TableBody></Table></Card>}</>}

export function PermissionsListPage(){const[p,setP]=useState<Permission[]>([]);const[module,setModule]=useState('');useEffect(()=>{accountsApi.permissions(module?{module}:undefined).then(setP)},[module]);const modules=useMemo(()=>[...new Set(p.map(x=>x.module))],[p]);return <><PageHeader title="Autorisations" description="Consultez les autorisations disponibles et suivez les demandes d’accès."/><div className="mb-5 flex flex-wrap gap-3"><PermissionGuard permission={P.LIST_PERMISSION_REQUESTS}><Button render={<Link to="/app/permissions/demandes"/>} variant="outline">Demandes d’accès</Button></PermissionGuard><PermissionGuard permission={P.REQUEST_PERMISSION}><Button render={<Link to="/app/permissions/demandes/nouvelle"/>}>Demander un accès</Button></PermissionGuard></div><div className="mb-5"><select className="h-11 rounded-xl border bg-background px-3" value={module} onChange={x=>setModule(x.target.value)}><option value="">Toutes les familles</option>{modules.map(m=><option key={m}>{m}</option>)}</select></div><div className="grid gap-4 md:grid-cols-2">{p.map(x=><Card key={x.id}><CardContent className="p-5"><div className="flex justify-between"><div><p className="font-semibold">{x.libelle}</p><p className="text-sm text-muted-foreground">{x.module} · {x.code}</p></div><Button render={<Link to={`/app/permissions/${x.id}`}/>} variant="outline" size="sm">Voir</Button></div></CardContent></Card>)}</div></>}
export function PermissionDetailPage(){const{permissionId}=useParams();const[p,setP]=useState<Permission|null>(null);useEffect(()=>{if(permissionId)accountsApi.permission(+permissionId).then(setP)},[permissionId]);if(!p)return<Loading/>;return <><PageHeader title={p.libelle} backTo="/app/permissions"/><Card><CardContent className="space-y-5 p-7"><p><b>Code :</b> {p.code}</p><p><b>Module :</b> {p.module}</p><p><b>Description :</b> {p.description||'—'}</p><p><b>Statut :</b> {p.statut}</p></CardContent></Card></>}

export function RoleAssignmentsPage(){const[rows,setRows]=useState<RoleAssignment[]>([]);const[assignments,setAssignments]=useState<ActorAssignment[]>([]);const[roles,setRoles]=useState<Role[]>([]);const[f,setF]=useState({affectation_acteur_id:'',role_id:'',date_expiration:''});async function load(){setRows(await accountsApi.roleAssignments());setAssignments(await accountsApi.assignments());setRoles(await accountsApi.roles())}useEffect(()=>{void load()},[]);return <><PageHeader title="Attributions de rôles"/><PermissionGuard permission={P.ASSIGN_ROLE}><Card className="mb-5"><CardContent className="grid gap-3 p-5 sm:grid-cols-4"><select className="h-11 rounded-xl border bg-background px-3" value={f.affectation_acteur_id} onChange={x=>setF(v=>({...v,affectation_acteur_id:x.target.value}))}><option value="">Affectation</option>{assignments.map(a=><option key={a.id} value={a.id}>{a.acteur.nom_complet} · {a.niveau_affectation}</option>)}</select><select className="h-11 rounded-xl border bg-background px-3" value={f.role_id} onChange={x=>setF(v=>({...v,role_id:x.target.value}))}><option value="">Rôle</option>{roles.map(r=><option key={r.id} value={r.id}>{r.libelle}</option>)}</select><Input type="date" value={f.date_expiration} onChange={x=>setF(v=>({...v,date_expiration:x.target.value}))}/><Button onClick={async()=>{await accountsApi.createRoleAssignment({affectation_acteur_id:+f.affectation_acteur_id,role_id:+f.role_id,date_expiration:f.date_expiration||null});await load()}}>Attribuer</Button></CardContent></Card></PermissionGuard><Card><Table><TableHeader><TableRow><TableHead>Affectation</TableHead><TableHead>Rôle</TableHead><TableHead>Expiration</TableHead><TableHead/></TableRow></TableHeader><TableBody>{rows.map(x=><TableRow key={x.id}><TableCell>#{x.affectation_acteur_id}</TableCell><TableCell>{x.role.libelle}</TableCell><TableCell>{x.date_expiration||'Aucune'}</TableCell><TableCell><PermissionGuard permission={P.REMOVE_ROLE}><Button variant="destructive" size="sm" onClick={async()=>{await accountsApi.removeRoleAssignment(x.id);await load()}}>Retirer</Button></PermissionGuard></TableCell></TableRow>)}</TableBody></Table></Card></>}
export function DirectPermissionsPage(){const[rows,setRows]=useState<DirectPermission[]>([]);const[assignments,setAssignments]=useState<ActorAssignment[]>([]);const[perms,setPerms]=useState<Permission[]>([]);const[f,setF]=useState({affectation_acteur_id:'',permission_id:'',motif:''});async function load(){setRows(await accountsApi.directPermissions());setAssignments(await accountsApi.assignments());setPerms(await accountsApi.permissions())}useEffect(()=>{void load()},[]);return <><PageHeader title="Autorisations particulières"/><PermissionGuard permission={P.ASSIGN_DIRECT_PERMISSION}><Card className="mb-5"><CardContent className="grid gap-3 p-5 sm:grid-cols-4"><select className="h-11 rounded-xl border bg-background px-3" value={f.affectation_acteur_id} onChange={x=>setF(v=>({...v,affectation_acteur_id:x.target.value}))}><option value="">Affectation</option>{assignments.map(a=><option key={a.id} value={a.id}>{a.acteur.nom_complet}</option>)}</select><select className="h-11 rounded-xl border bg-background px-3" value={f.permission_id} onChange={x=>setF(v=>({...v,permission_id:x.target.value}))}><option value="">Permission</option>{perms.map(p=><option key={p.id} value={p.id}>{p.libelle}</option>)}</select><Input placeholder="Motif" value={f.motif} onChange={x=>setF(v=>({...v,motif:x.target.value}))}/><Button onClick={async()=>{await accountsApi.addDirectPermission({affectation_acteur_id:+f.affectation_acteur_id,permission_id:+f.permission_id,motif:f.motif});await load()}}>Attribuer</Button></CardContent></Card></PermissionGuard><Card><Table><TableHeader><TableRow><TableHead>Affectation</TableHead><TableHead>Autorisation</TableHead><TableHead>Motif</TableHead><TableHead/></TableRow></TableHeader><TableBody>{rows.map(x=><TableRow key={x.id}><TableCell>#{x.affectation_acteur_id}</TableCell><TableCell>{x.permission.libelle}</TableCell><TableCell>{x.motif||'—'}</TableCell><TableCell><PermissionGuard permission={P.REMOVE_DIRECT_PERMISSION}><Button variant="destructive" size="sm" onClick={async()=>{await accountsApi.removeDirectPermission(x.id);await load()}}>Retirer</Button></PermissionGuard></TableCell></TableRow>)}</TableBody></Table></Card></>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="space-y-2"><Label>{label}</Label>{children}</div>}
