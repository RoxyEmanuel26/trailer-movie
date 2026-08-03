import { SettingRepository } from "../repositories/SettingRepository";

export class SettingService {
  static async getGroup(group: string) {
    return SettingRepository.listByGroup(group);
  }
}
