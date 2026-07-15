import { httpClient } from "@/api/http-client"
import type { ExpectedField, ImportError, ImportRow, ListResponse, Mapping, OfficialImport, PaginatedResponse, Progress } from "./types"
const list=<T>(data:ListResponse<T>)=>Array.isArray(data)?data:data.results
export const importsApi={
  async list(params?:Record<string,string|number|undefined>){return list((await httpClient.get<ListResponse<OfficialImport>>("/imports/imports-officiels/",{params})).data)},
  async detail(id:number){return (await httpClient.get<OfficialImport>(`/imports/imports-officiels/${id}/`)).data},
  async create(data:{session:number;type_source:string;fichier:File;commentaire:string;continuer_malgre_doublon?:boolean}){const body=new FormData();body.append("session",String(data.session));body.append("type_source",data.type_source);body.append("fichier",data.fichier);body.append("commentaire",data.commentaire);if(data.continuer_malgre_doublon)body.append("continuer_malgre_doublon","true");return (
    await httpClient.post<OfficialImport>(
      "/imports/imports-officiels/",
      body,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
  ).data},
  async expectedFields(type_source:string){return (await httpClient.get<{type_source:string;champs:ExpectedField[]}>("/imports/imports-officiels/champs-attendus/",{params:{type_source}})).data},
  async progress(id:number){return (await httpClient.get<Progress>(`/imports/imports-officiels/${id}/progression/`)).data},
  async retryRead(id:number){return (await httpClient.post(`/imports/imports-officiels/${id}/relancer-lecture/`)).data},
  async validateMapping(id:number,data:{correspondances:{champ_cible:string;colonne_source:string}[];parametres_lecture?:Record<string,number>}){return (await httpClient.post<OfficialImport>(`/imports/imports-officiels/${id}/valider-correspondance/`,data)).data},
  async validateRows(id:number){return (await httpClient.post(`/imports/imports-officiels/${id}/valider-lignes/`)).data},
  async confirm(id:number){return (await httpClient.post(`/imports/imports-officiels/${id}/confirmer/`)).data},
  async cancel(id:number,message:string){return (await httpClient.post<OfficialImport>(`/imports/imports-officiels/${id}/annuler/`,{message})).data},
  async remove(id:number){return (await httpClient.post(`/imports/imports-officiels/${id}/supprimer-logiquement/`)).data},
  async mappings(importId:number){return list((await httpClient.get<ListResponse<Mapping>>("/imports/correspondances-colonnes/",{params:{import_id:importId}})).data)},
  async rows(importId:number,params?:{page?:number;page_size?:number;statut?:string;search?:string}){return (await httpClient.get<PaginatedResponse<ImportRow>>("/imports/lignes/",{params:{import_id:importId,page:params?.page||1,page_size:params?.page_size||50,statut:params?.statut||undefined,search:params?.search||undefined}})).data},
  async errors(importId:number,params?:{page?:number;page_size?:number;gravite?:string;search?:string}){return (await httpClient.get<PaginatedResponse<ImportError>>("/imports/erreurs/",{params:{import_id:importId,page:params?.page||1,page_size:params?.page_size||50,gravite:params?.gravite||undefined,search:params?.search||undefined}})).data},
  async fixRow(id:number,donnees_corrigees:Record<string,unknown>){return (await httpClient.patch<ImportRow>(`/imports/lignes/${id}/corriger/`,{donnees_corrigees})).data},
  async ignoreRow(id:number,message:string){return (await httpClient.post<ImportRow>(`/imports/lignes/${id}/ignorer/`,{message})).data},
  async ignoreRows(importId:number,ligneIds:number[],motif:string){return (await httpClient.post<{detail:string;lignes:ImportRow[]}>("/imports/lignes/ignorer-plusieurs/",{import_id:importId,ligne_ids:ligneIds,motif})).data},
  async reintegrateRows(importId:number,ligneIds:number[]){return (await httpClient.post<{detail:string;lignes:ImportRow[]}>("/imports/lignes/reintegrer-plusieurs/",{import_id:importId,ligne_ids:ligneIds})).data},
  async revalidateRow(id:number){return (await httpClient.post(`/imports/lignes/${id}/revalider/`)).data},
}
