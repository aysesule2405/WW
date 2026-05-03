import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../users/users.repository'

const userRepo = new UserRepository()

export class AuthService {
  async register(email: string, username: string, password: string) {
    const existingByEmail = await userRepo.findByEmail(email)
    if (existingByEmail) throw new Error('Email already in use')

    const existingByUsername = await userRepo.findByUsername(username)
    if (existingByUsername) throw new Error('Username already in use')

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const userId = await userRepo.create({ email, username, passwordHash: hash })

    return { userId, message: 'User created successfully' }
  }

  async login(email: string, password: string) {
    const user = await userRepo.findByEmail(email)
    if (!user) throw new Error('User not found')

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) throw new Error('Invalid credentials')

    if (!process.env.JWT_SECRET) throw new Error('JWT secret not configured')

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })

    return { token, username: user.username }
  }
}