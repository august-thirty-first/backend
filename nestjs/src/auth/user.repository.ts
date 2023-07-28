import { Repository } from 'typeorm';
import { User } from './entities/User.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/userCreate.dto';

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

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.create(createUserDto);
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
