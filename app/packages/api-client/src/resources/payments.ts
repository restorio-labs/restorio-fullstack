import type {
  // CreateTransactionData,
  // CreateTransactionRequest,
  // TransactionListData,
  UpdateP24ConfigData,
  UpdateP24ConfigRequest,
  UpdatedResponse,
} from "@restorio/types";

import { BaseResource } from "./base";

export class PaymentsResource extends BaseResource {
  async updateP24Config(
    tenantId: string,
    data: UpdateP24ConfigRequest,
    signal?: AbortSignal,
  ): Promise<UpdateP24ConfigData> {
    const response = await this.client.put<UpdatedResponse<UpdateP24ConfigData>>(
      `/payments/tenants/${tenantId}/p24-config`,
      data,
      { signal },
    );

    return response.data;
  }

  // async createPayment(
  //   data: CreateTransactionRequest,
  //   signal?: AbortSignal,
  // ): Promise<CreateTransactionData> {
  //   const response = await this.client.post<CreatedResponse<CreateTransactionData>>(
  //     `/payments/create`,
  //     data,
  //     { signal },
  //   );

  //   return response.data;
  // }

  // async listTransactions(
  //   signal?: AbortSignal,
  // ): Promise<TransactionListData> {
  //   const response = await this.client.get<TransactionListData>(
  //     `/payments/transactions`,
  //     { signal },
  //   );

  //   return response.data;
  // }
}
