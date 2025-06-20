"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSubscriptionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class PushSubscriptionDto {
}
exports.PushSubscriptionDto = PushSubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'https://fcm.googleapis.com/fcm/send/...',
        description: 'Push service endpoint URL'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushSubscriptionDto.prototype, "endpoint", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { p256dh: 'key...', auth: 'key...' },
        description: 'Encryption keys'
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PushSubscriptionDto.prototype, "keys", void 0);
//# sourceMappingURL=push-subscription.dto.js.map