import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SubmitKrsDto {
  @ApiProperty({ example: ['course-id-1', 'course-id-2'] })
  @IsArray()
  @IsString({ each: true })
  courseIds: string[];
}
