import { Controller, Get, Put, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IntegrationSettingsService } from './integration-settings.service';
import { UpdateBankSettingDto } from './dto/update-bank-setting.dto';
import { UpdatePddiktiSettingDto } from './dto/update-pddikti-setting.dto';

@ApiTags('Integration Settings')
@Controller('integration-settings')
export class IntegrationSettingsController {
  constructor(private readonly integrationSettingsService: IntegrationSettingsService) {}

  @Get('bank')
  @ApiOperation({ summary: 'Mendapatkan konfigurasi payment gateway bank (Khusus Super Admin)' })
  async getBankSetting() {
    return this.integrationSettingsService.getBankSetting();
  }

  @Put('bank')
  @ApiOperation({ summary: 'Memperbarui konfigurasi payment gateway bank (Khusus Super Admin)' })
  async updateBankSetting(@Body() dto: UpdateBankSettingDto, @Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.integrationSettingsService.updateBankSetting(dto, userId);
  }

  @Get('pddikti')
  @ApiOperation({ summary: 'Mendapatkan konfigurasi koneksi Web Service Neo Feeder PDDIKTI (Khusus Super Admin)' })
  async getPddiktiSetting() {
    return this.integrationSettingsService.getPddiktiSetting();
  }

  @Put('pddikti')
  @ApiOperation({ summary: 'Memperbarui konfigurasi koneksi PDDIKTI (Khusus Super Admin)' })
  async updatePddiktiSetting(@Body() dto: UpdatePddiktiSettingDto, @Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.integrationSettingsService.updatePddiktiSetting(dto, userId);
  }

  @Post('pddikti/test-connection')
  @ApiOperation({ summary: 'Menguji koneksi ke endpoint Web Service Neo Feeder PDDIKTI' })
  async testPddiktiConnection() {
    return this.integrationSettingsService.testPddiktiConnection();
  }
}
