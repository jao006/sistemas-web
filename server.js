const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const SEGREDO = 'segredo-super-secreto'

const usuarios = [
  { email: 'admin@loja.com', senha: '123456', role: 'admin' },
  { email: 'cliente@loja.com', senha: '123456', role: 'cliente' }
]

let produtos = [
  { nome: 'Camiseta', preco: 49.90 },
  { nome: 'Caneca', preco: 24.90 },
  { nome: 'Boné', preco: 39.90 }
]

app.post('/login', (req, res) => {
  const { email, senha } = req.body
  const usuario = usuarios.find(u => u.email === email && u.senha === senha)

  if (!usuario) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos' })
  }

  const token = jwt.sign({ email: usuario.email, role: usuario.role }, SEGREDO, { expiresIn: '1h' })
  res.json({ token })
})

app.get('/produtos', (req, res) => {
  res.json(produtos)
})

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não fornecido' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const dados = jwt.verify(token, SEGREDO)
    req.usuario = dados
    next()
  } catch {
    return res.status(401).json({ erro: 'Token inválido' })
  }
}

function somenteAdmin(req, res, next) {
  if (req.usuario.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso permitido apenas para administradores' })
  }
  next()
}

app.post('/produtos', verificarToken, somenteAdmin, (req, res) => {
  const { nome, preco } = req.body
  produtos.push({ nome, preco })
  res.status(201).json({ mensagem: 'Produto cadastrado com sucesso' })
})

app.delete('/produtos/:nome', verificarToken, somenteAdmin, (req, res) => {
  const nomeProcurado = req.params.nome
  const existe = produtos.some(p => p.nome === nomeProcurado)

  if (!existe) {
    return res.status(404).json({ erro: 'Produto não encontrado' })
  }

  produtos = produtos.filter(p => p.nome !== nomeProcurado)
  res.json({ mensagem: 'Produto excluído com sucesso' })
})

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000')
})