import { Injectable } from '@nestjs/common';
import { Model, Schema } from 'mongoose';
import { QueryDto } from '../dto/query.dto';

@Injectable()
export class QueryBuilderService<T> {
  buildQuery(model: Model<T>, queryDto: QueryDto) {
    const { page = 1, limit = 10, sort, filter } = queryDto;

    const query = model.find();

    if (filter) {
      const schemaPaths = Object.keys(model.schema.paths);
      const transformedFilter: Record<string, any> = {};
      for (const key in filter) {
        if (schemaPaths.includes(key)) {
          transformedFilter[key] = filter[key];
        } else {
          transformedFilter[`custom_fields.${key}`] = filter[key];
        }
      }
      query.where(transformedFilter);
    }

    if (sort) {
      const [field, order] = sort.split('_');
      query.sort({ [field]: order === 'desc' ? -1 : 1 });
    }

    query.skip((page - 1) * limit).limit(limit);

    return query;
  }
}
