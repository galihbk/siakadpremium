import { Module } from '@nestjs/common';
import { DocumentSignaturesController } from './document-signatures.controller';
import { DocumentSignaturesService } from './document-signatures.service';

@Module({
  controllers: [DocumentSignaturesController],
  providers: [DocumentSignaturesService],
  exports: [DocumentSignaturesService],
})
export class DocumentSignaturesModule {}
