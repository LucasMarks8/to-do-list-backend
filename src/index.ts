import express, { Request, Response } from 'express'
import cors from 'cors'
import { db } from './database/knex'
import { TUserDB } from './database/types'

const app = express()

app.use(cors())
app.use(express.json())

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`)
})

const regexEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;

const regexPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,12}$/g;

app.get("/ping", async (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Pong!" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

//Get all users

app.get("/users", async (req: Request, res: Response) => {
    try {
        const searchTerm = req.query.q as string | undefined

        if (searchTerm === undefined) {
            const result = await db("users")
            res.status(200).send(result)
        } else {
            const result = await db("users").where("name", "LIKE", `%${searchTerm}%`)
            res.status(200).send(result)
        }
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

//Create user

app.post("/users", async (req: Request, res: Response) => {
    try {
        const { id, name, email, password } = req.body

        if (typeof id !== "string") {
            res.status(400)
            throw new Error("'id' deve ser string");
        }

        if (id.length < 2) {
            res.status(400)
            throw new Error("'id' deve possuir pelo menos 4 caracteres");
        }

        if (typeof name !== "string") {
            res.status(400)
            throw new Error("'name' deve ser string");
        }

        if (name.length < 2) {
            res.status(400)
            throw new Error("'name' deve possuir pelo menos 4 caracteres");
        }

        if (typeof email !== "string") {
            res.status(400)
            throw new Error("'email' deve ser string");
        }

        if (!email.match(regexEmail)) {
            res.status(400)
            throw new Error("'email' deve possuir letras minúsculas, deve ter um @, letras minúsculas, ponto (.) e de 2 a 4 letras minúsculas");
        }

        if (email.length < 2) {
            res.status(400)
            throw new Error("'email' deve possuir pelo menos 4 caracteres");
        }

        if (typeof password !== "string") {
            res.status(400);
            throw new Error("'password' deve ser uma string");
        }

        if (!password.match(regexPassword)) {
            res.status(400);
            throw new Error(
                "'password' deve possuir entre 8 e 12 caracteres, com letras maiúsculas e minúsculas e no mínimo um número e um caractere especial"
            );
        }

        const [userIdAlreadyExists]: TUserDB[] | undefined[] = await db("users").where({ id })

        if (userIdAlreadyExists) {
            res.status(400)
            throw new Error("'id' já existe");
        }

        const [userEmailAlreadyExists]: TUserDB[] | undefined[] = await db("users").where({ email })

        if (userEmailAlreadyExists) {
            res.status(400)
            throw new Error("'email' já existe");
        }

        const newUser: TUserDB = {
            id,
            name,
            email,
            password
        }

        await db("users").insert(newUser)

        res.status(200).send({
            message: "usuário cadastrado com sucesso",
            user: newUser
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

// Delete user

app.delete("/users/:id", async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        const [ userAlreadyExists ]: TUserDB[] | undefined[] = await db("users").where({id: idToDelete})

        if(!userAlreadyExists) {
            res.status(404)
            throw new Error("'id não existe");
        }

        await db("users").del().where({id: idToDelete})

        res.status(200).send({ message: "usuário deletado com sucesso"})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})