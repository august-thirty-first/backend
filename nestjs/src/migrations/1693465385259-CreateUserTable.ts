import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1693465385259 implements MigrationInterface {
    name = 'CreateUserTable1693465385259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "achievement" ("id" SERIAL NOT NULL, "domain" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "value" integer NOT NULL, CONSTRAINT "PK_441339f40e8ce717525a381671e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "intra_name" character varying NOT NULL, "avata_path" character varying, "otp_key" character varying, "nickname" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_869204d59cd4f6d526e525f9517" UNIQUE ("intra_name"), CONSTRAINT "UQ_e2364281027b926b879fa2fa1e0" UNIQUE ("nickname"), CONSTRAINT "UQ_cace4a159ff9f2512dd42373760" UNIQUE ("id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_achievement" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "achievement_id" integer NOT NULL, CONSTRAINT "UQ_47db305cc6e77e8f88fe0aec8cd" UNIQUE ("user_id", "achievement_id"), CONSTRAINT "PK_99df4f0afe2d706c05004854aa5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."chat_status_enum" AS ENUM('public', 'protected', 'private')`);
        await queryRunner.query(`CREATE TABLE "chat" ("id" SERIAL NOT NULL, "room_name" character varying NOT NULL, "status" "public"."chat_status_enum" NOT NULL, "password" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."chat_participant_authority_enum" AS ENUM('boss', 'admin', 'normal')`);
        await queryRunner.query(`CREATE TABLE "chat_participant" ("id" SERIAL NOT NULL, "authority" "public"."chat_participant_authority_enum" NOT NULL, "ban" TIMESTAMP, "authority_time" TIMESTAMP NOT NULL, "chat_room_id" integer, "user_id" integer, CONSTRAINT "PK_b126b533dd62e4be694073b20e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."friend_requesting_status_enum" AS ENUM('allow', 'requesting', 'reject', 'delete')`);
        await queryRunner.query(`CREATE TABLE "friend_requesting" ("id" SERIAL NOT NULL, "status" "public"."friend_requesting_status_enum" NOT NULL, "time" TIMESTAMP NOT NULL DEFAULT now(), "from_user_id" integer NOT NULL, "to_user_id" integer NOT NULL, CONSTRAINT "UQ_00baf3082b2c7a3be2f4af51ac4" UNIQUE ("from_user_id", "to_user_id"), CONSTRAINT "PK_1edebfb49a727aa90c7ca650773" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "friends" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "friend_request_id" integer NOT NULL, "user_id1" integer NOT NULL, "user_id2" integer NOT NULL, CONSTRAINT "UQ_5473e2dfcea6ef122e3209cf2b6" UNIQUE ("user_id1", "user_id2"), CONSTRAINT "REL_c08ef0c23c5c837ad38838d1bd" UNIQUE ("friend_request_id"), CONSTRAINT "PK_65e1b06a9f379ee5255054021e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ladder" ("id" SERIAL NOT NULL, "score" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "REL_76decc218cc1493cbbff50371d" UNIQUE ("user_id"), CONSTRAINT "PK_6e47c37db7f4399fa3d43ad2448" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "black_list" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "from_user_id" integer, "to_user_id" integer, CONSTRAINT "PK_6969ca1c62bdf4fef47a85b8195" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."game_history_gametype_enum" AS ENUM('gerneral', 'ladder')`);
        await queryRunner.query(`CREATE TABLE "game_history" ("id" SERIAL NOT NULL, "gameType" "public"."game_history_gametype_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "winner_id" integer, "loser_id" integer, CONSTRAINT "PK_0e74b90c56b815ed54e90a29f1a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_achievement" ADD CONSTRAINT "FK_676d00b5a31b28beaab0617b265" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_achievement" ADD CONSTRAINT "FK_14f2bb86ac0603a47ae089b0d26" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_participant" ADD CONSTRAINT "FK_d8de8259cae6de085d3f0eaa03d" FOREIGN KEY ("chat_room_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_participant" ADD CONSTRAINT "FK_d81d31d6cf105fb83b76e8fa5a8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_requesting" ADD CONSTRAINT "FK_a2c7330db853ccfdd2c2881d414" FOREIGN KEY ("from_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_requesting" ADD CONSTRAINT "FK_dd9b4baff7687c4a0a7f9845ae6" FOREIGN KEY ("to_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_c08ef0c23c5c837ad38838d1bda" FOREIGN KEY ("friend_request_id") REFERENCES "friend_requesting"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_04b3a90100f57b7cdb16481be54" FOREIGN KEY ("user_id1") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_8be4a5e68634e938754ef085916" FOREIGN KEY ("user_id2") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ladder" ADD CONSTRAINT "FK_76decc218cc1493cbbff50371d2" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "black_list" ADD CONSTRAINT "FK_e792e2c00eddd64eb1e26bcb125" FOREIGN KEY ("from_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "black_list" ADD CONSTRAINT "FK_1812c11d6d3d609c8bdb960199b" FOREIGN KEY ("to_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_history" ADD CONSTRAINT "FK_7019e74ea4d02635745a61c58e1" FOREIGN KEY ("winner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_history" ADD CONSTRAINT "FK_bfbf49da476f5a8a3e25ed5e1d3" FOREIGN KEY ("loser_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_history" DROP CONSTRAINT "FK_bfbf49da476f5a8a3e25ed5e1d3"`);
        await queryRunner.query(`ALTER TABLE "game_history" DROP CONSTRAINT "FK_7019e74ea4d02635745a61c58e1"`);
        await queryRunner.query(`ALTER TABLE "black_list" DROP CONSTRAINT "FK_1812c11d6d3d609c8bdb960199b"`);
        await queryRunner.query(`ALTER TABLE "black_list" DROP CONSTRAINT "FK_e792e2c00eddd64eb1e26bcb125"`);
        await queryRunner.query(`ALTER TABLE "ladder" DROP CONSTRAINT "FK_76decc218cc1493cbbff50371d2"`);
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_8be4a5e68634e938754ef085916"`);
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_04b3a90100f57b7cdb16481be54"`);
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_c08ef0c23c5c837ad38838d1bda"`);
        await queryRunner.query(`ALTER TABLE "friend_requesting" DROP CONSTRAINT "FK_dd9b4baff7687c4a0a7f9845ae6"`);
        await queryRunner.query(`ALTER TABLE "friend_requesting" DROP CONSTRAINT "FK_a2c7330db853ccfdd2c2881d414"`);
        await queryRunner.query(`ALTER TABLE "chat_participant" DROP CONSTRAINT "FK_d81d31d6cf105fb83b76e8fa5a8"`);
        await queryRunner.query(`ALTER TABLE "chat_participant" DROP CONSTRAINT "FK_d8de8259cae6de085d3f0eaa03d"`);
        await queryRunner.query(`ALTER TABLE "user_achievement" DROP CONSTRAINT "FK_14f2bb86ac0603a47ae089b0d26"`);
        await queryRunner.query(`ALTER TABLE "user_achievement" DROP CONSTRAINT "FK_676d00b5a31b28beaab0617b265"`);
        await queryRunner.query(`DROP TABLE "game_history"`);
        await queryRunner.query(`DROP TYPE "public"."game_history_gametype_enum"`);
        await queryRunner.query(`DROP TABLE "black_list"`);
        await queryRunner.query(`DROP TABLE "ladder"`);
        await queryRunner.query(`DROP TABLE "friends"`);
        await queryRunner.query(`DROP TABLE "friend_requesting"`);
        await queryRunner.query(`DROP TYPE "public"."friend_requesting_status_enum"`);
        await queryRunner.query(`DROP TABLE "chat_participant"`);
        await queryRunner.query(`DROP TYPE "public"."chat_participant_authority_enum"`);
        await queryRunner.query(`DROP TABLE "chat"`);
        await queryRunner.query(`DROP TYPE "public"."chat_status_enum"`);
        await queryRunner.query(`DROP TABLE "user_achievement"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "achievement"`);
    }

}
