import express, { Request, Response } from 'express'
import cors from 'cors'
import { db } from './database/knex'
import { TTaskDB, TUserDB, TUserTaskDB } from './database/types'

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

        if( idToDelete[0] !== "f") {
            res.status(400)
            throw new Error("'id' deve iniciar com a letra 'f");
        }

        const [userAlreadyExists]: TUserDB[] | undefined[] = await db("users").where({ id: idToDelete })

        if (!userAlreadyExists) {
            res.status(404)
            throw new Error("'id não existe");
        }

        await db("users").del().where({ id: idToDelete })

        res.status(200).send({ message: "usuário deletado com sucesso" })

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

//Get all tasks

app.get("/tasks", async (req: Request, res: Response) => {
    try {
        const searchTerm = req.query.q as string | undefined

        if (searchTerm === undefined) {
            const result = await db("tasks")
            res.status(200).send(result)
        } else {
            const result = await db("tasks").where("title", "LIKE", `%${searchTerm}%`)
                .orWhere("description", "LIKE", `%${searchTerm}%`)
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

//Create tasks

app.post("/tasks", async (req: Request, res: Response) => {
    try {
        const { id, title, description } = req.body

        if (typeof id !== "string") {
            res.status(400)
            throw new Error("'id' deve ser string");
        }

        if (id.length < 2) {
            res.status(400)
            throw new Error("'id' deve possuir pelo menos 4 caracteres");
        }

        if (typeof title !== "string") {
            res.status(400)
            throw new Error("'title' deve ser string");
        }

        if (title.length < 2) {
            res.status(400)
            throw new Error("'title' deve possuir pelo menos 4 caracteres");
        }

        if (typeof description !== "string") {
            res.status(400)
            throw new Error("'description' deve ser string");
        }

        const [tasksIdAlreadyExists]: TTaskDB[] | undefined[] = await db("tasks").where({ id })

        if (tasksIdAlreadyExists) {
            res.status(400)
            throw new Error("'id' já existe");
        }

        const newTask = {
            id,
            title,
            description
        }

        await db("tasks").insert(newTask)

        const [ insertedTask ]: TTaskDB[] = await db("tasks").where({ id })

        res.status(200).send({
            message: "tarefa cadastrada com sucesso",
            user: insertedTask
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


// Edit task

app.put("/tasks/:id", async (req: Request, res: Response) => {
    try {
        const idToEdit = req.params.id

        const newId = req.body.id
        const newTitle = req.body.title
        const newDescription = req.body.description
        const newCreatedAt = req.body.createdAt
        const newStatus = req.body.status

        if(newId !== undefined) {
            if (typeof newId !== "string") {
                res.status(400)
                throw new Error("'id' deve ser string");
            }
    
            if (newId.length < 2) {
                res.status(400)
                throw new Error("'id' deve possuir pelo menos 4 caracteres");
            }
        }

        if (newTitle !== undefined) {
            if (typeof newTitle !== "string") {
                res.status(400)
                throw new Error("'title' deve ser string");
            }
    
            if (newTitle.length < 2) {
                res.status(400)
                throw new Error("'title' deve possuir pelo menos 4 caracteres");
            }
        }
        
        if (newDescription !== undefined) {
            if (typeof newDescription !== "string") {
                res.status(400)
                throw new Error("'description' deve ser string");
            }
        }

        if (newCreatedAt !== undefined) {
            if (typeof newCreatedAt !== "string") {
                res.status(400)
                throw new Error("'createdAt' deve ser string");
            }
        }

        
        if (newStatus !== undefined) {
            if (typeof newStatus !== "string") {
                res.status(400)
                throw new Error("'status' deve ser number (0 para incompleta e 1 para completa");
            }
        }
      
        const [ task ]: TTaskDB[] | undefined[] = await db("tasks").where({ id: idToEdit })

        if (!task) {
            res.status(404)
            throw new Error("'id' não encontrado");
        }

        const newTask: TTaskDB = {
            id: newId || task.id,
            title: newTitle || task.title,
            description: newDescription || task.description,
            created_at: newCreatedAt || task.created_at,
            status: isNaN(newStatus) ? task.status : newStatus
        }

        await db("tasks").update(newTask).where({ id: idToEdit })

        res.status(200).send({
            message: "tarefa criada com sucesso",
            user: newTask
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

// Delete task

app.delete("/tasks/:id", async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        if( idToDelete[0] !== "t") {
            res.status(400)
            throw new Error("'id' deve iniciar com a letra 't");
        }

        const [ taskIdToDelete ]: TTaskDB[] | undefined[] = await db("tasks").where({ id: idToDelete })

        if (!taskIdToDelete) {
            res.status(404)
            throw new Error("'id não existe");
        }

        await db("tasks").del().where({ id: idToDelete })

        res.status(200).send({ message: "tarefa deletada com sucesso" })

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

// Create 

app.post("/tasks/:taskId/users/:userId", async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId
        const userId = req.params.userId

        if( taskId[0] !== "t") {
            res.status(400)
            throw new Error("'id' deve iniciar com a letra 't");
        }

        if( userId[0] !== "f") {
            res.status(400)
            throw new Error("'id' deve iniciar com a letra 'f");
        }

        const [ task ]: TTaskDB[] | undefined[] = await db("tasks").where({ id: taskId })

        if (!task) {
            res.status(404)
            throw new Error("'taskId não existe");
        }

        const [ user ]: TTaskDB[] | undefined[] = await db("users").where({ id: userId })

        if (!user) {
            res.status(404)
            throw new Error("'userId não existe");
        }

        const newUserTask: TUserTaskDB = {
            task_id: taskId,
            user_id: userId
        }

        await db("users_tasks").insert(newUserTask)

        res.status(201).send({ message: "user atribuido à terafa com sucesso"})

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



