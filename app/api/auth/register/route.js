import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Zod Validation Schema
const registerSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email format").refine(val => val.endsWith('@gmail.com'), {
        message: "Only Gmail addresses are allowed"
    }),
    password: z.string().min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[0-9]/, "Must contain at least one number")
});

export async function POST(request) {
    try {
        const body = await request.json();

        // 1. Validate Input
        const validatedData = registerSchema.parse(body);

        // 2. Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData.password, salt);

        // 4. Create User in Database
        const newUser = await prisma.user.create({
            data: {
                name: `${validatedData.firstName} ${validatedData.lastName}`,
                email: validatedData.email.toLowerCase(),
                password: hashedPassword,
                role: 'CUSTOMER'
            }
        });

        const { password, ...userWithoutPassword } = newUser;

        return NextResponse.json({
            message: 'User registered successfully',
            user: userWithoutPassword
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.errors }, { status: 400 });
        }
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}