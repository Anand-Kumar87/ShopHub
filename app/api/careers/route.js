import { NextResponse } from 'next/server';

export async function GET() {
    const jobs = [
        { id: 1, title: "Senior Frontend Developer", department: "Engineering", location: "Remote", type: "Full-Time" },
        { id: 2, title: "Customer Support Specialist", department: "Support", location: "New York, NY", type: "Full-Time" }
    ];
    return NextResponse.json(jobs, { status: 200 });
}