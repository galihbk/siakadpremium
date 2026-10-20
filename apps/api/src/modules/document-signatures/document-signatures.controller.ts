import { BadRequestException, Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentSignaturesService, SignerRole } from './document-signatures.service';

@ApiTags('Document Signatures (Aturan Tanda Tangan Dokumen)')
@Controller('document-signatures')
export class DocumentSignaturesController {
  constructor(private readonly service: DocumentSignaturesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Daftar peran penandatangan yang tersedia' })
  getRoles() {
    return this.service.getRoles();
  }

  @Get('rules')
  @ApiOperation({ summary: 'Daftar aturan tanda tangan per jenis dokumen (Super Admin)' })
  getRules() {
    return this.service.getRules();
  }

  @Put('rules/:documentCode')
  @ApiOperation({ summary: 'Mengubah penandatangan sebuah jenis dokumen (Super Admin). Jenis dokumen sendiri ditetapkan pengembang.' })
  updateRule(
    @Param('documentCode') documentCode: string,
    @Body()
    body: {
      signer1Role: SignerRole;
      signer1Label?: string;
      signer2Role?: SignerRole | null;
      signer2Label?: string;
      notes?: string;
    },
  ) {
    return this.service.updateRule(documentCode, body);
  }

  @Get('resolve')
  @ApiOperation({ summary: 'Resolusi nama & jabatan penandatangan nyata untuk sebuah dokumen & mahasiswa' })
  resolve(@Query('documentCode') documentCode: string, @Query('studentId') studentId?: string) {
    if (!documentCode?.trim()) throw new BadRequestException('Parameter documentCode wajib diisi.');
    return this.service.resolveSigners(documentCode, studentId);
  }
}
