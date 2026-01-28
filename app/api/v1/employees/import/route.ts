import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'Файл сонгоогүй байна' }, { status: 400 });
    }

    // Read Excel file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    if (data.length === 0) {
      return NextResponse.json({ message: 'Excel файл хоосон байна' }, { status: 400 });
    }

    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
      created: [] as string[],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (header is row 1)

      try {
        // Validate required fields
        const email = row['Email'] || row['email'] || row['И-мэйл'];
        const firstName = row['FirstName'] || row['firstName'] || row['Нэр'];
        const lastName = row['LastName'] || row['lastName'] || row['Овог'];
        const department = row['Department'] || row['department'] || row['Хэлтэс'];
        const companyName = row['Company'] || row['company'] || row['Компани'] || row['Компанийн нэр'];
        const locationName = row['Location'] || row['location'] || row['Газрын нэр'];
        const password = row['Password'] || row['password'] || row['Нууц үг'];

        if (!email || !firstName || !lastName) {
          results.failed++;
          results.errors.push(`Мөр ${rowNum}: И-мэйл, нэр, овог заавал шаардлагатай`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed++;
          results.errors.push(`Мөр ${rowNum}: И-мэйл буруу форматтай - ${email}`);
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          results.failed++;
          results.errors.push(`Мөр ${rowNum}: И-мэйл бүртгэлтэй байна - ${email}`);
          continue;
        }

        // Hash password if provided, otherwise use default
        const defaultPassword = 'Welcome2024!';
        const hashedPassword = await bcrypt.hash(password || defaultPassword, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            password: hashedPassword,
            companyName: companyName || null,
            locationName: locationName || null,
            department: department || null,
            role: 'EMPLOYEE',
            isActive: true,
          },
        });

        results.success++;
        results.created.push(email);

      } catch (error: any) {
        results.failed++;
        results.errors.push(`Мөр ${rowNum}: Алдаа гарлаа - ${error.message}`);
      }
    }

    return NextResponse.json({
      message: 'Импорт дууслаа',
      results,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Employee import error:', error);
    return NextResponse.json(
      { message: 'Импорт хийхэд алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
