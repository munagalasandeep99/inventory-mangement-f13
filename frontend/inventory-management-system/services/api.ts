import { InventoryItem } from '../types';
import { userPool } from '../cognito-config';

const API_ENDPOINT = 'https://xe11sqsoyk.execute-api.us-east-1.amazonaws.com';

const getAuthHeader = async (): Promise<HeadersInit> => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      return resolve({});
    }

    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session || !session.isValid()) {
        return resolve({});
      }
      const token = session.getIdToken().getJwtToken();
      resolve({
        'Authorization': `Bearer ${token}`
      });
    });
  });
};

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // Could not parse error JSON, use status text
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return { success: true, message: text };
  }
};


// Fetch all inventory items
export async function fetchItems(): Promise<InventoryItem[]> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_ENDPOINT}/items`, {
     headers: { ...authHeader, 'Content-Type': 'application/json' },
  });
  const data = await handleApiResponse(response);
  
  if (data && Array.isArray(data.Items)) {
    return data.Items;
  }
  if (data && Array.isArray(data.items)) {
    return data.items;
  }
  if (Array.isArray(data)) {
    return data;
  }
  
  console.warn('Fetched items data is not in an expected format:', data);
  throw new Error('API response for items is not in the expected format.');
}

// Create a new inventory item
export async function createItem(itemData: Omit<InventoryItem, 'itemId' | 'createdAt' | 'updatedAt'>): Promise<any> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_ENDPOINT}/items`, {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  return handleApiResponse(response);
}

// Update an existing inventory item
export async function updateItem(itemData: Partial<InventoryItem> & { itemId: string }): Promise<any> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_ENDPOINT}/items`, {
    method: 'PUT',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  return handleApiResponse(response);
}

// Delete an inventory item
export async function deleteItem(itemId: string): Promise<any> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_ENDPOINT}/items?itemId=${itemId}`, {
    method: 'DELETE',
    headers: {
        ...authHeader
    }
  });
  return handleApiResponse(response);
}