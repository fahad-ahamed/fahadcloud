import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export abstract class BaseRepository<T> {
  protected abstract model: any;
  
  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }
  
  async findMany(params?: { where?: any; include?: any; orderBy?: any; skip?: number; take?: number; select?: any }): Promise<T[]> {
    return this.model.findMany(params || {});
  }
  
  async findOne(where: any, include?: any): Promise<T | null> {
    return this.model.findFirst({ where, include });
  }
  
  async create(data: any): Promise<T> {
    return this.model.create({ data });
  }
  
  async update(id: string, data: any): Promise<T> {
    return this.model.update({ where: { id }, data });
  }
  
  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }
  
  async deleteMany(where: any): Promise<number> {
    const result = await this.model.deleteMany({ where });
    return result.count;
  }
  
  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }
  
  async aggregate(params: any): Promise<any> {
    return this.model.aggregate(params);
  }
  
  async groupBy(params: any): Promise<any[]> {
    return this.model.groupBy(params);
  }
  
  async exists(where: any): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
  
  async paginate(params: { where?: any; include?: any; orderBy?: any; page?: number; limit?: number; select?: any }) {
    const { page = 1, limit = 20, where, include, orderBy, select } = params;
    const [items, total] = await Promise.all([
      this.model.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit, select }),
      this.model.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
