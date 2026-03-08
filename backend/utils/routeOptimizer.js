const axios = require("axios");
const Bin = require("../models/Bin");
const User = require("../models/User");

// ==============================
// 1️⃣ FIND FULL BINS
// ==============================
async function findFullBins(threshold) {
  return await Bin.find({ level: { $gte: threshold } });
}

// ==============================
// 2️⃣ DISTANCE MATRIX USING OSRM
// ==============================
async function getDistanceMatrix(bins) {
  const coordinates = bins
    .map(bin => `${bin.longitude},${bin.latitude}`)
    .join(";");

  const url = `https://router.project-osrm.org/table/v1/driving/${coordinates}?annotations=distance`;

  const response = await axios.get(url);

  return response.data.distances; // distance matrix in meters
}

// ==============================
// 3️⃣ NEAREST NEIGHBOR OPTIMIZATION
// ==============================
// ==============================
// 3️⃣ NEAREST NEIGHBOR OPTIMIZATION
// ==============================
async function optimizeRoute(bins) {
  if (bins.length <= 1) {
    return { bins, totalDistance: 0 };
  }

  // Calculate cluster center for better starting point
  const centerLat = bins.reduce((sum, b) => sum + b.latitude, 0) / bins.length;
  const centerLon = bins.reduce((sum, b) => sum + b.longitude, 0) / bins.length;

  try {
    const distanceMatrix = await getDistanceMatrix(bins);

    const visited = new Array(bins.length).fill(false);
    const optimizedOrder = [];
    let totalDistance = 0;

    // Start with the bin closest to the hypothetical "depot" (start) or just the first bin
    // For now, let's start with the one closest to the average center for better radial ordering
    let currentIndex = 0;
    let minCenterDist = Infinity;
    for (let i = 0; i < bins.length; i++) {
      const d = haversineDistance({ latitude: centerLat, longitude: centerLon }, bins[i]);
      if (d < minCenterDist) {
        minCenterDist = d;
        currentIndex = i;
      }
    }

    optimizedOrder.push(bins[currentIndex]);
    visited[currentIndex] = true;

    for (let step = 1; step < bins.length; step++) {
      let nearestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < bins.length; i++) {
        // Use OSRM distance matrix for true driving distances if available
        if (!visited[i]) {
          const dist = distanceMatrix[currentIndex][i] || haversineDistance(bins[currentIndex], bins[i]) * 1000;
          if (dist < minDistance) {
            minDistance = dist;
            nearestIndex = i;
          }
        }
      }

      if (nearestIndex !== -1) {
        visited[nearestIndex] = true;
        optimizedOrder.push(bins[nearestIndex]);
        totalDistance += minDistance;
        currentIndex = nearestIndex;
      }
    }

    return {
      bins: optimizedOrder,
      totalDistance: totalDistance / 1000 // convert to km
    };
  } catch (error) {
    console.error("OSRM Optimization failed, falling back to Haversine:", error);
    // Fallback if axios/OSRM fails
    const sorted = [...bins].sort((a, b) => {
      const distA = haversineDistance({ latitude: centerLat, longitude: centerLon }, a);
      const distB = haversineDistance({ latitude: centerLat, longitude: centerLon }, b);
      return distA - distB;
    });
    return { bins: sorted, totalDistance: 0 };
  }
}

// ==============================
// 4️⃣ SIMPLE CLUSTERING (GROUP BY PROXIMITY)
// ==============================
function groupBinsByProximity(bins, maxDistanceKm = 5) {
  const groups = [];
  const used = new Set();

  for (let i = 0; i < bins.length; i++) {
    if (used.has(i)) continue;

    const group = [bins[i]];
    used.add(i);

    for (let j = 0; j < bins.length; j++) {
      if (used.has(j)) continue;

      // Group bins that are close to ANY bin already in the group (Chaining)
      let closeEnough = false;
      for (const binInGroup of group) {
        if (haversineDistance(binInGroup, bins[j]) <= maxDistanceKm) {
          closeEnough = true;
          break;
        }
      }

      if (closeEnough) {
        group.push(bins[j]);
        used.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
  const dLon = (b.longitude - a.longitude) * (Math.PI / 180);

  const lat1 = a.latitude * (Math.PI / 180);
  const lat2 = b.latitude * (Math.PI / 180);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(x));
}

// ==============================
// 5️⃣ FIND NEAREST AVAILABLE WORKER
// ==============================
async function findNearestWorker(group) {
  // Find cluster center
  const centerLat = group.reduce((sum, b) => sum + b.latitude, 0) / group.length;
  const centerLon = group.reduce((sum, b) => sum + b.longitude, 0) / group.length;

  // For now, get all workers and find the one closest to cluster center
  // In a real system, you'd check active/available workers
  const workers = await User.find({ role: "worker" });
  if (workers.length === 0) return null;

  let nearestWorker = workers[0];
  let minDist = Infinity;

  for (const worker of workers) {
    // If worker has a home address, use it. Otherwise, assume they're at a default depot or city center
    const workerPos = worker.homeAddress?.latitude ? 
      { latitude: worker.homeAddress.latitude, longitude: worker.homeAddress.longitude } :
      { latitude: centerLat, longitude: centerLon }; // Fallback to center if no pos

    const dist = haversineDistance(workerPos, { latitude: centerLat, longitude: centerLon });
    if (dist < minDist) {
      minDist = dist;
      nearestWorker = worker;
    }
  }

  return nearestWorker;
}

module.exports = {
  findFullBins,
  optimizeRoute,
  groupBinsByProximity,
  findNearestWorker
};