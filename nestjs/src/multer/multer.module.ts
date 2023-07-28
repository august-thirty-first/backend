import { Module } from '@nestjs/common';
import { diskStorage } from 'multer';
import { MulterModule } from '@nestjs/platform-express';
import * as mime from 'mime-types';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, callback) => {
          callback(null, './images');
        },
        filename: (req, file, callback) => {
          callback(
            null,
            `${file.fieldname}-${Date.now()}.${mime.extension(file.mimetype)}`,
          );
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedFileTypes = ['.jpg', '.jpeg', '.png'];
        const fileExt = extname(file.originalname).toLowerCase();
        if (allowedFileTypes.includes(fileExt)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('not support file type'), false);
        }
      },
      limits: {
        fileSize: 1024 * 1024 * 5, // 5 MB
        files: 1,
      },
    }),
  ],
  exports: [MulterModule],
})
export class MulterModules {}
