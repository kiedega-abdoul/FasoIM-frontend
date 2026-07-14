import { z } from "zod"

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Saisissez votre identifiant."),
  password: z.string().min(1, "Saisissez votre mot de passe."),
})

export type LoginFormValues = z.infer<typeof loginSchema>
