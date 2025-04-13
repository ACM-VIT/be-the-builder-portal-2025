import domains from './sort.json';
import prisma, { checkConnectionHealth, resetPrismaConnection } from './prisma';
import { Prisma } from "@prisma/client";

// Map of emails to their domains from sort.json
const emailToDomainMap = new Map(
  domains.map((entry: { Email: string; Domain: string }) => [
    entry.Email.toLowerCase(),
    entry.Domain
  ])
);

const RETRY_CODES = [
  'P1001', // The database server is not reachable
  'P1002', // The database server was reached but timed out
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
  'P2024', // Connection pool timeout
];

/**
 * Retry a database operation with exponential backoff
 * @param operation The database operation to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Result of the operation
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 100
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      if (
        retries >= maxRetries ||
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        !RETRY_CODES.includes(error.code)
      ) {
        throw error;
      }
      
      retries++;
      const delay = initialDelay * Math.pow(2, retries - 1);
      console.log(`Retrying operation. Attempt ${retries} after ${delay}ms. Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Assign domain to user based on sort.json mapping
 */
export async function assignDomainToUser(userId: string, email: string) {
  const domain = emailToDomainMap.get(email.toLowerCase());
  
  if (domain) {
    try {
      return await retryOperation(async () => {
        return prisma.user.update({
          where: { id: userId },
          data: { domain }
        });
      });
    } catch (error: any) {
      console.error('Failed to assign domain to user after retries:', error);
      return { error: error.message || 'Failed to assign domain to user' };
    }
  }
  
  return { error: 'Domain not found in sort.json' };
}

/**
 * Get teams with counts of users by domain
 */
export async function getTeamsWithDomainCounts() {
  try {
    return await retryOperation(async () => {
      // Get all teams
      const teams = await prisma.team.findMany({
        include: {
          users: {
            select: {
              domain: true,
            },
          },
        },
      });

      // Count users by domain for each team
      const teamsWithDomainCounts = teams.map((team) => {
        const domainCounts: Record<string, number> = {};

        team.users.forEach((user) => {
          if (user.domain) {
            domainCounts[user.domain] = (domainCounts[user.domain] || 0) + 1;
          }
        });

        return {
          ...team,
          domainCounts,
        };
      });

      return teamsWithDomainCounts;
    });
  } catch (error: any) {
    console.error("Error getting teams with domain counts:", error);
    return { error: error.message || "Failed to get teams with domain counts" };
  }
}

/**
 * Get a list of all unique domains from sort.json
 */
export async function getAllDomains() {
  try {
    return await retryOperation(async () => {
      const users = await prisma.user.findMany({
        where: {
          domain: {
            not: null,
          },
        },
        select: {
          domain: true,
        },
      });

      // Get unique domains
      const domains = [...new Set(users.map((user) => user.domain))];
      return domains.filter(Boolean) as string[];
    });
  } catch (error: any) {
    console.error('Error getting domains:', error);
    return { error: error.message || 'Failed to get domains' };
  }
}

/**
 * Automatically assign users to teams to ensure domain distribution
 */
export async function autoAssignUsersToTeams() {
  try {
    return await retryOperation(async () => {
      const users = await prisma.user.findMany({
        where: {
          team: null,
          email: {
            not: undefined
          }
        },
        select: {
          id: true,
          email: true,
        },
      });

      let count = 0;
      for (const user of users) {
        if (!user.email) continue;
        
        const assignResult = await assignDomainToUser(user.id, user.email);
        // Check if assignResult is not an error object
        if (!('error' in assignResult)) {
          count++;
        }
      }

      return { success: true, count };
    });
  } catch (error: any) {
    console.error('Error auto-assigning users to teams:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
} 