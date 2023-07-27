import { Repository } from 'typeorm';
import { User } from './entities/User.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { Request } from 'express';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super(
      userRepository.target,
      userRepository.manager,
      userRepository.queryRunner,
    );
  }

  async createUser(nickname: string, intra_name: string): Promise<User> {
    const user = this.create({
      nickname,
      intra_name,
      created_at: new Date(),
      updated_at: new Date(),
    });

    try {
      await this.save(user);
      console.log('save 성공');
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return user;
  }
}
