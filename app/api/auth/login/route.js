export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-enterprise-key';

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required")
});

export async function POST(request) {
    // 🔥 VERCEL BUILD ERROR FIX: PrismaClient ko function ke ANDAR likha hai
    const prisma = new PrismaClient();

    try {
        const body = await request.json();
        const validatedData = loginSchema.parse(body);

        // 1. Find User
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email.toLowerCase() }
        });

        if (!user) {
            await prisma.$disconnect();
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // 2. Verify Password
        const validPassword = await bcrypt.compare(validatedData.password, user.password);
        if (!validPassword) {
            await prisma.$disconnect();
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // 3. Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password, ...userWithoutPassword } = user;

        // Disconnect before sending response
        await prisma.$disconnect();

        // 4. Return success with token
        return NextResponse.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        }, { status: 200 });

    } catch (error) {
        // Disconnect in case of error too
        await prisma.$disconnect();
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.errors }, { status: 400 });
        }
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
