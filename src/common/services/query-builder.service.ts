import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueryDto } from '../dto/query.dto';

@Injectable()
export class QueryBuilderService<T> {
  async buildQuery(model: Model<T>, queryDto: QueryDto) {
    const { page = 1, limit = 25, sort, filter } = queryDto;
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const mongoFilter: Record<string, any> = {};

    if (filter) {
      const schemaPaths = Object.keys(model.schema.paths);
      for (const key in filter) {
        if (schemaPaths.includes(key)) {
          mongoFilter[key] = filter[key];
        } else {
          mongoFilter[`custom_fields.${key}`] = filter[key];
        }
      }
    }

    // Default sort: createdAt descending; override with query param
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort) {
      // Support "field_desc", "field_asc", or "field:desc"
      const [field, order] = sort.replace(':', '_').split('_');
      if (field) sortObj = { [field]: order === 'asc' ? 1 : -1 };
    }

    const [data, total] = await Promise.all([
      model.find(mongoFilter).sort(sortObj).skip(skip).limit(safeLimit).exec(),
      model.countDocuments(mongoFilter).exec(),
    ]);

    return { data, total, page, limit: safeLimit };
  }
}
