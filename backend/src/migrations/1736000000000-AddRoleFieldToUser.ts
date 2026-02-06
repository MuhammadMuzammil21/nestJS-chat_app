import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleFieldToUser1736000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if role column already exists
        const table = await queryRunner.getTable('users');
        const roleColumn = table?.findColumnByName('role');

        if (!roleColumn) {
            // Create enum type if it doesn't exist
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE TYPE "user_role_enum" AS ENUM ('FREE', 'PREMIUM', 'ADMIN');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);

            // Add role column with default value
            await queryRunner.addColumn(
                'users',
                new TableColumn({
                    name: 'role',
                    type: 'enum',
                    enum: ['FREE', 'PREMIUM', 'ADMIN'],
                    default: "'FREE'",
                    isNullable: false,
                }),
            );

            // Update existing users to have FREE role if they don't have one
            await queryRunner.query(`
                UPDATE users SET role = 'FREE' WHERE role IS NULL;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('users');
        const roleColumn = table?.findColumnByName('role');

        if (roleColumn) {
            await queryRunner.dropColumn('users', 'role');
            
            // Drop enum type
            await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum";`);
        }
    }
}

