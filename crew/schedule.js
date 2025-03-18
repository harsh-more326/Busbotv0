class Route {
    constructor(routeId, estimatedTime, length, avgPriority) {
      this.routeId = routeId;
      this.estimatedTime = estimatedTime;
      this.length = length;
      this.avgPriority = avgPriority;
      this.schedule = [];
      this.lastAssignedTime = null; // Track when this route was last assigned
      // Calculate frequency based on priority
      this.frequency = this._calculateFrequency();
    }
    
    _calculateFrequency() {
      // Map priority (1-10) to frequency (40-10 minutes)
      // Higher priority (10) = lower frequency (10 minutes)
      // Lower priority (1) = higher frequency (40 minutes)
      
      // Ensure priority is in range 1-10
      const normalizedPriority = Math.max(1, Math.min(10, this.avgPriority));
      
      // Linear mapping from priority to frequency
      // Priority 1 -> 40 minutes
      // Priority 10 -> 10 minutes
      return Math.floor(40 - ((normalizedPriority - 1) / 9) * 30);
    }
  }
  
  class Employee {
    constructor(empId, name, shift) {
      this.empId = empId;
      this.name = name;
      this.shift = shift;
      this.assignedRoutes = [];
      this.totalWorkTime = 0;
      this.targetWorkTime = 540;
      this.availableAfter = null; // Time when employee becomes available again
    }
  }
  
  // Constants
  const WORK_START = "06:00";
  const WORK_END = "01:00";
  const PEAK_HOURS = [[8, 10, 30], [17, 20, 30]];
  const REQUIRED_WORK_TIME = 420;
  const MORNING_SHIFT = [6, 14];
  const EVENING_SHIFT = [14, 25];
  
  function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  
  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }
  
  function generateSchedule(routes, startTime = "06:00") {
    // Create a master schedule with all possible time slots
    let currentTime = parseTime(startTime);
    let endTime = parseTime(WORK_END);
    
    // Handle end time being on the next day
    if (endTime < currentTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    // Reset route schedules
    for (const route of routes) {
      route.schedule = [];
      route.lastAssignedTime = null;
    }
    
    // Create a dictionary to track when each route should be scheduled next
    const nextScheduleTime = {};
    for (const route of routes) {
      nextScheduleTime[route.routeId] = currentTime;
    }
    
    // Process all time slots in chronological order
    while (currentTime < endTime) {
      // Determine the time interval to the next slot
      let interval = 10;
      for (const [peakStart, peakEnd, peakMin] of PEAK_HOURS) {
        if (peakStart <= currentTime.getHours() && currentTime.getHours() < peakEnd) {
          interval = Math.floor(peakMin / 2);
        }
      }
      
      const timeSlot = formatTime(currentTime);
      
      // Check which routes should be scheduled at this time
      for (const route of routes) {
        // If it's time to schedule this route
        if (currentTime >= nextScheduleTime[route.routeId]) {
          // Add to schedule
          route.schedule.push(timeSlot);
          route.lastAssignedTime = timeSlot;
          
          // Calculate when to schedule this route next
          // During peak hours, potentially decrease the interval
          let peakFactor = 1.0;
          for (const [peakStart, peakEnd, _] of PEAK_HOURS) {
            if (peakStart <= currentTime.getHours() && currentTime.getHours() < peakEnd) {
              // Routes run more frequently during peak hours
              peakFactor = 0.7;
              break;
            }
          }
          
          // Set the next time to schedule this route
          const adjustedFrequency = Math.max(10, Math.floor(route.frequency * peakFactor));
          nextScheduleTime[route.routeId] = addMinutes(currentTime, adjustedFrequency);
        }
      }
      // Move to next time slot
      currentTime = addMinutes(currentTime, interval);
    }
    
    return routes;
  }
  
  function calculateRequiredEmployees(routes) {
    let totalMorningMinutes = 0;
    let totalEveningMinutes = 0;
    
    // First generate a priority-based schedule
    routes = generateSchedule(routes);
    
    for (const route of routes) {
      for (const departureTime of route.schedule) {
        const dt = parseTime(departureTime);
        const totalWorkMinutes = route.estimatedTime;
        if (MORNING_SHIFT[0] <= dt.getHours() && dt.getHours() < MORNING_SHIFT[1]) {
          totalMorningMinutes += totalWorkMinutes;
        } else {
          totalEveningMinutes += totalWorkMinutes;
        }
      }
    }
    
    // Increase the number of employees to ensure all routes are covered
    // Use a smaller divisor to calculate more employees than strictly necessary
    const adjustedRequiredWorkTime = REQUIRED_WORK_TIME * 0.9; // Add 10% buffer
    
    const morningEmployees = Math.ceil(totalMorningMinutes / adjustedRequiredWorkTime);
    const eveningEmployees = Math.ceil(totalEveningMinutes / adjustedRequiredWorkTime);
    return [morningEmployees, eveningEmployees, routes];
  }
  
  function assignEmployees(routes, employees, maxRetries = 3) {
    // Try multiple assignment strategies if needed
    for (let retry = 0; retry < maxRetries; retry++) {
      const [schedule, morningAssigned, morningTotal, eveningAssigned, eveningTotal] = tryAssignEmployees(
        routes, employees, retry
      );
      
      // If we've achieved full assignment, return the results
      if (morningAssigned === morningTotal && eveningAssigned === eveningTotal) {
        console.log(`Full assignment achieved on attempt ${retry + 1}`);
        return [schedule, morningAssigned, morningTotal, eveningAssigned, eveningTotal];
      }
    }
    
    // If we've tried all strategies and still haven't fully assigned, return the best result
    console.log(`Could not achieve full assignment after ${maxRetries} attempts`);
    return tryAssignEmployees(routes, employees, 0);
  }
  
  function tryAssignEmployees(routes, employees, retryStrategy = 0) {
    const schedule = {};
    for (const emp of employees) {
      schedule[emp.empId] = {
        name: emp.name,
        routes: []
      };
    }
    
    const morningEmployees = employees.filter(e => e.shift === "morning");
    const eveningEmployees = employees.filter(e => e.shift === "evening");
    
    // Create a list of all departure times
    const allDepartures = [];
    
    // Track which departures have already been assigned
    const assignedDepartures = new Set();
    
    for (const route of routes) {
      for (const departureTime of route.schedule) {
        const dt = parseTime(departureTime);
        
        // Create a unique identifier for this route+time combination
        const departureId = `${route.routeId}_${departureTime}`;
        
        // Only add if not already assigned
        if (!assignedDepartures.has(departureId)) {
          allDepartures.push({
            route: route,
            departureTime: departureTime,
            dt: dt,
            endTime: addMinutes(dt, route.estimatedTime),
            duration: route.estimatedTime,
            departureId: departureId,
            priority: route.avgPriority // Add priority for sorting
          });
        }
      }
    }
    
    // Sort all departures based on strategy
    if (retryStrategy === 0) {
      // Default: Sort by time
      allDepartures.sort((a, b) => a.dt - b.dt);
    } else if (retryStrategy === 1) {
      // Strategy 1: Sort by priority then time
      allDepartures.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.dt - b.dt;
      });
    } else {
      // Strategy 2: Sort by time but prioritize routes with fewer departures
      const routeCounts = {};
      for (const d of allDepartures) {
        const routeId = d.route.routeId;
        if (!(routeId in routeCounts)) {
          routeCounts[routeId] = 0;
        }
        routeCounts[routeId] += 1;
      }
      
      // Add count to each departure
      for (const d of allDepartures) {
        d.routeCount = routeCounts[d.route.routeId];
      }
      
      // Sort by route count (ascending), then time
      allDepartures.sort((a, b) => {
        if (a.routeCount !== b.routeCount) {
          return a.routeCount - b.routeCount;
        }
        return a.dt - b.dt;
      });
    }
    
    // Split into morning and evening departures
    const morningDepartures = allDepartures.filter(
      d => MORNING_SHIFT[0] <= d.dt.getHours() && d.dt.getHours() < MORNING_SHIFT[1]
    );
    const eveningDepartures = allDepartures.filter(
      d => !(MORNING_SHIFT[0] <= d.dt.getHours() && d.dt.getHours() < MORNING_SHIFT[1])
    );
  
    function assignShiftDepartures(shiftEmployees, shiftDepartures) {
      let assignedCount = 0;
      const totalCount = shiftDepartures.length;
      
      // Initialize employee availability
      for (const emp of shiftEmployees) {
        emp.availableAfter = parseTime(WORK_START);
        emp.totalWorkTime = 0; // Reset work time
      }
      
      // Track route variety per employee
      const employeeRouteCounts = {};
      for (const emp of shiftEmployees) {
        employeeRouteCounts[emp.empId] = {};
      }
      
      // First pass: try to assign all departures
      const unassignedDepartures = [];
      for (const departure of shiftDepartures) {
        let assignedEmployee = null;
        let minScore = Infinity;
        
        // Skip if this departure has already been assigned
        if (assignedDepartures.has(departure.departureId)) {
          continue;
        }
          
        const routeId = departure.route.routeId;
        const currentTime = departure.dt;
        
        for (const emp of shiftEmployees) {
          // Skip if employee is not available yet
          if (emp.availableAfter && currentTime < emp.availableAfter) {
            continue;
          }
          
          // Check for schedule conflicts
          let hasConflict = false;
          for (const assigned of schedule[emp.empId].routes) {
            const assignedStart = parseTime(assigned[1]);
            const assignedEnd = parseTime(assigned[2]);
            if (!(departure.endTime <= assignedStart || currentTime >= assignedEnd)) {
              hasConflict = true;
              break;
            }
          }
          
          if (!hasConflict) {
            // Calculate score based on work time and route variety
            const routeCount = employeeRouteCounts[emp.empId][routeId] || 0;
            
            // Adjust weights based on retry strategy
            let workTimeWeight, varietyWeight;
            if (retryStrategy === 0) {
              workTimeWeight = 1.0;
              varietyWeight = 2.0;
            } else if (retryStrategy === 1) {
              workTimeWeight = 0.5;
              varietyWeight = 1.0; // Reduce variety penalty to assign more routes
            } else {
              // Focus more on balancing work time
              workTimeWeight = 2.0;
              varietyWeight = 0.5;
            }
            
            const workTimeScore = (emp.totalWorkTime / 10) * workTimeWeight;
            const varietyScore = routeCount * 20 * varietyWeight;
            
            // Add a small random factor to break ties
            const randomFactor = Math.random() * 5;
            
            const totalScore = workTimeScore + varietyScore + randomFactor;
            
            // Prefer employees with lower scores
            if (totalScore < minScore) {
              minScore = totalScore;
              assignedEmployee = emp;
            }
          }
        }
        
        if (assignedEmployee) {
          // Update schedule and employee work time
          schedule[assignedEmployee.empId].routes.push([
            departure.route.routeId,
            formatTime(currentTime),
            formatTime(departure.endTime)
          ]);
          
          // Update employee availability
          assignedEmployee.availableAfter = departure.endTime;
          assignedEmployee.totalWorkTime += departure.duration;
          assignedCount += 1;
          
          // Mark this departure as assigned
          assignedDepartures.add(departure.departureId);
          
          // Update route variety tracking
          if (!(routeId in employeeRouteCounts[assignedEmployee.empId])) {
            employeeRouteCounts[assignedEmployee.empId][routeId] = 0;
          }
          employeeRouteCounts[assignedEmployee.empId][routeId] += 1;
        } else {
          // If couldn't assign, add to unassigned list for second pass
          unassignedDepartures.push(departure);
        }
      }
      
      // Second pass: try to assign remaining departures with more relaxed constraints
      if (unassignedDepartures.length > 0) {
        console.log(`Attempting to assign ${unassignedDepartures.length} unassigned departures in second pass`);
        
        // Sort unassigned departures by time
        unassignedDepartures.sort((a, b) => a.dt - b.dt);
        
        for (const departure of unassignedDepartures) {
          // Skip if this departure has already been assigned
          if (assignedDepartures.has(departure.departureId)) {
            continue;
          }
            
          const routeId = departure.route.routeId;
          const currentTime = departure.dt;
          
          // Find employee with least work time
          const availableEmployees = [...shiftEmployees].sort((a, b) => a.totalWorkTime - b.totalWorkTime);
          
          for (const emp of availableEmployees) {
            // Check for schedule conflicts
            let hasConflict = false;
            for (const assigned of schedule[emp.empId].routes) {
              const assignedStart = parseTime(assigned[1]);
              const assignedEnd = parseTime(assigned[2]);
              if (!(departure.endTime <= assignedStart || currentTime >= assignedEnd)) {
                hasConflict = true;
                break;
              }
            }
            
            if (!hasConflict) {
              // Assign to this employee
              schedule[emp.empId].routes.push([
                departure.route.routeId,
                formatTime(currentTime),
                formatTime(departure.endTime)
              ]);
              
              // Update employee work time
              emp.totalWorkTime += departure.duration;
              assignedCount += 1;
              
              // Mark this departure as assigned
              assignedDepartures.add(departure.departureId);
              
              // Update route variety tracking
              if (!(routeId in employeeRouteCounts[emp.empId])) {
                employeeRouteCounts[emp.empId][routeId] = 0;
              }
              employeeRouteCounts[emp.empId][routeId] += 1;
              
              break;
            }
          }
        }
      }
      
      return [assignedCount, totalCount];
    }
  
    const [morningAssigned, morningTotal] = assignShiftDepartures(morningEmployees, morningDepartures);
    const [eveningAssigned, eveningTotal] = assignShiftDepartures(eveningEmployees, eveningDepartures);
  
    // Sort each employee's routes by start time
    for (const empId in schedule) {
      schedule[empId].routes.sort((a, b) => {
        const timeA = parseTime(a[1]);
        const timeB = parseTime(b[1]);
        return timeA - timeB;
      });
    }
    
    return [schedule, morningAssigned, morningTotal, eveningAssigned, eveningTotal];
  }
  
  function displayRouteSchedules(routes, schedule) {
    /*Display the schedule for each route with assigned employees*/
    const routeSchedules = {};
    
    // Initialize routeSchedules dictionary
    for (const route of routes) {
      routeSchedules[route.routeId] = {};
    }
    
    // Populate route schedules from employee assignments
    for (const [empId, data] of Object.entries(schedule)) {
      const employeeName = data.name;
      for (const [routeId, startTime, endTime] of data.routes) {
        if (!(startTime in routeSchedules[routeId])) {
          routeSchedules[routeId][startTime] = [];
        }
        routeSchedules[routeId][startTime].push([endTime, employeeName, empId]);
      }
    }
    
    // Display each route's schedule
    console.log("\n===== ROUTE SCHEDULES =====");
    for (const route of routes) {
      const routeId = route.routeId;
      console.log(`\nRoute ${routeId} Schedule (Priority: ${route.avgPriority}, Frequency: ${route.frequency} minutes):`);
      console.log(`${"Start Time".padEnd(10)} ${"End Time".padEnd(10)} ${"Employee".padEnd(15)} ${"ID".padEnd(6)}`);
      console.log("-".repeat(45));
      
      // Get sorted list of departure times
      const departureTimes = Object.keys(routeSchedules[routeId]).sort((a, b) => {
        return parseTime(a) - parseTime(b);
      });
      
      for (const startTime of departureTimes) {
        // There should only be one employee per route per departure time
        if (routeSchedules[routeId][startTime].length > 0) {
          const [endTime, employeeName, empId] = routeSchedules[routeId][startTime][0];
          console.log(`${startTime.padEnd(10)} ${endTime.padEnd(10)} ${employeeName.padEnd(15)} ${empId.padEnd(6)}`);
        }
      }
      
      // Count total scheduled departures
      const totalScheduledDepartures = route.schedule.length;
      const coveredDepartures = Object.keys(routeSchedules[routeId]).length;
      
      console.log(`\nScheduled departures: ${totalScheduledDepartures}`);
      console.log(`Covered departures: ${coveredDepartures}`);
      
      // Calculate departure coverage percentage
      const departureCoverage = totalScheduledDepartures > 0 ? (coveredDepartures / totalScheduledDepartures) * 100 : 0;
      console.log(`Departure coverage: ${departureCoverage.toFixed(1)}% (${coveredDepartures}/${totalScheduledDepartures} departures)`);
    }
  }
  
  // Example Routes and Employees with varying priorities
  const routes = [
    new Route("R1", 40, 12, 10),   // Highest priority route (10/10) - every 10 minutes
    new Route("R2", 40, 18, 5),    // Medium priority route (5/10) - every 25 minutes
    new Route("R3", 30, 8, 1)      // Lowest priority route (1/10) - every 40 minutes
  ];
  
  // Print frequency for each route
  console.log("Route Frequencies:");
  for (const route of routes) {
    console.log(`Route ${route.routeId} (Priority ${route.avgPriority}): Every ${route.frequency} minutes`);
  }
  
  // Calculate required employees and generate schedule
  const [morningEmp, eveningEmp, routesWithSchedule] = calculateRequiredEmployees(routes);
  
  console.log(`Adjusted required employees: Morning: ${morningEmp}, Evening: ${eveningEmp}`);
  
  const employees = [];
  for (let i = 0; i < morningEmp + eveningEmp; i++) {
    employees.push(new Employee(`E${i+1}`, `Employee ${i+1}`, i < morningEmp ? "morning" : "evening"));
  }
  
  const [schedule, morningAssigned, morningTotal, eveningAssigned, eveningTotal] = assignEmployees(routesWithSchedule, employees);
  
  // Display route schedules
  displayRouteSchedules(routesWithSchedule, schedule);
  
  // Output statistics
  console.log("\n===== ASSIGNMENT STATISTICS =====");
  console.log(`Total Morning Routes: ${morningTotal}, Assigned: ${morningAssigned}`);
  console.log(`Total Evening Routes: ${eveningTotal}, Assigned: ${eveningAssigned}`);
  console.log(`Total Required Employees: Morning: ${morningEmp}, Evening: ${eveningEmp}`);
  
  // Check if all routes are assigned
  const allAssigned = (morningAssigned === morningTotal) && (eveningAssigned === eveningTotal);
  console.log(`\nAll routes assigned: ${allAssigned ? 'Yes' : 'No'}`);
  if (!allAssigned) {
    console.log("Routes not fully assigned. Consider adding more employees or adjusting scheduling parameters.");
  }
  
  // Save detailed output to a file (using Node.js fs module)
  // Note: In a browser environment, you would use a different approach to save data
  const fs = require('fs');
  const outputFile = "schedulejs.txt";
  
  let outputContent = "";
  
  // Write route information
  outputContent += "Route Information:\n";
  for (const route of routes) {
    outputContent += `Route ${route.routeId}: Priority ${route.avgPriority}, Frequency every ${route.frequency} minutes\n`;
    outputContent += `  Total scheduled departures: ${route.schedule.length}\n`;
  }
  outputContent += "\n";
  
  // Write schedule statistics
  outputContent += `Total Morning Routes: ${morningTotal}, Assigned: ${morningAssigned}\n`;
  outputContent += `Total Evening Routes: ${eveningTotal}, Assigned: ${eveningAssigned}\n\n`;
  
  // Write employee schedules
  for (const [empId, data] of Object.entries(schedule)) {
    outputContent += `\nEmployee: ${data.name} (${empId}) - ${employees.find(e => e.empId === empId).shift} shift\n`;
    
    // Count route distribution
    const routeCounts = {};
    for (const r of data.routes) {
      if (!(r[0] in routeCounts)) {
        routeCounts[r[0]] = 0;
      }
      routeCounts[r[0]] += 1;
    }
    
    // Print route distribution
    outputContent += "  Route distribution: ";
    for (const [rId, count] of Object.entries(routeCounts)) {
      outputContent += `${rId}(${count}) `;
    }
    outputContent += "\n";
    
    // Print detailed schedule
    for (const r of data.routes) {
      outputContent += `  Route ${r[0]}: ${r[1]} - ${r[2]}\n`;
    }
    
    // Calculate total work minutes
    const totalMinutes = data.routes.reduce((sum, r) => {
      const startTime = parseTime(r[1]);
      const endTime = parseTime(r[2]);
      // Handle cases where end time might be on the next day
      let diffMinutes = (endTime - startTime) / (1000 * 60);
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // Add 24 hours in minutes
      }
      return sum + diffMinutes;
    }, 0);
    
    outputContent += `  Total work time: ${Math.floor(totalMinutes / 60)} hours ${Math.floor(totalMinutes % 60)} minutes\n`;
  }
  
  try {
    fs.writeFileSync(outputFile, outputContent);
    console.log(`\nDetailed output saved to ${outputFile}`);
  } catch (err) {
    console.error(`Error writing to file: ${err.message}`);
  }