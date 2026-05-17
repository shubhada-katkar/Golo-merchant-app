import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PublicNoticeDocument = PublicNotice & Document;

@Schema({ _id: false, timestamps: false })
export class PublicNotice {
  @Prop()
  noticetype?: string;

  @Prop()
  issuingAuthority?: string;

  @Prop()
  detailedNotice?: string;

  @Prop()
  pdf?: string;
}

export const PublicNoticeSchema = SchemaFactory.createForClass(PublicNotice);
