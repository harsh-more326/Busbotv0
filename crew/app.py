import math
from datetime import datetime, timedelta
import random

class Route:
    def __init__(self, route_id, estimated_time, length, avg_priority):
        self.route_id = route_id
        self.estimated_time = estimated_time
        self.length = length
        self.avg_priority = avg_priority
        self.schedule = []
        self.last_assigned_time = None  # Track when this route was last assigned
        # Calculate frequency based on priority
        self.frequency = self._calculate_frequency()
        
    def _calculate_frequency(self):
        # Map priority (1-10) to frequency (40-10 minutes)
        # Higher priority (10) = lower frequency (10 minutes)
        # Lower priority (1) = higher frequency (40 minutes)
        
        # Ensure priority is in range 1-10
        normalized_priority = max(1, min(10, self.avg_priority))
        
        # Linear mapping from priority to frequency
        # Priority 1 -> 40 minutes
        # Priority 10 -> 10 minutes
        return int(40 - ((normalized_priority - 1) / 9) * 30)

class Employee:
    def __init__(self, emp_id, name, shift):
        self.emp_id = emp_id
        self.name = name
        self.shift = shift
        self.assigned_routes = []
        self.total_work_time = 0
        self.target_work_time = 540
        self.available_after = None  # Time when employee becomes available again

# Constants
WORK_START = "06:00"
WORK_END = "01:00"
PEAK_HOURS = [(8, 10, 30), (17, 20, 30)]
REQUIRED_WORK_TIME = 420
MORNING_SHIFT = (6, 14)
EVENING_SHIFT = (14, 25)

def generate_schedule(routes, start_time="06:00"):
    # Create a master schedule with all possible time slots
    current_time = datetime.strptime(start_time, "%H:%M")
    end_time = datetime.strptime(WORK_END, "%H:%M") + timedelta(days=1)
    
    # Reset route schedules
    for route in routes:
        route.schedule = []
        route.last_assigned_time = None
    
    # Create a dictionary to track when each route should be scheduled next
    next_schedule_time = {route.route_id: current_time for route in routes}
    
    # Process all time slots in chronological order
    while current_time < end_time:
        # Determine the time interval to the next slot
        interval = 10
        for peak_start, peak_end, peak_min in PEAK_HOURS:
            if peak_start <= current_time.hour < peak_end:
                interval = peak_min // 2
        
        time_slot = current_time.strftime("%H:%M")
        
        # Check which routes should be scheduled at this time
        for route in routes:
            # If it's time to schedule this route
            if current_time >= next_schedule_time[route.route_id]:
                # Add to schedule
                route.schedule.append(time_slot)
                route.last_assigned_time = time_slot
                
                # Calculate when to schedule this route next
                # During peak hours, potentially decrease the interval
                peak_factor = 1.0
                for peak_start, peak_end, _ in PEAK_HOURS:
                    if peak_start <= current_time.hour < peak_end:
                        # Routes run more frequently during peak hours
                        peak_factor = 0.7
                        break
                
                # Set the next time to schedule this route
                adjusted_frequency = max(10, int(route.frequency * peak_factor))
                next_schedule_time[route.route_id] = current_time + timedelta(minutes=adjusted_frequency)
        # Move to next time slot
        current_time += timedelta(minutes=interval)
    
    return routes

def calculate_required_employees(routes):
    total_morning_minutes = 0
    total_evening_minutes = 0
    
    # First generate a priority-based schedule
    routes = generate_schedule(routes)
    
    for route in routes:
        for departure_time in route.schedule:
            dt = datetime.strptime(departure_time, "%H:%M")
            total_work_minutes = route.estimated_time
            if MORNING_SHIFT[0] <= dt.hour < MORNING_SHIFT[1]:
                total_morning_minutes += total_work_minutes
            else:
                total_evening_minutes += total_work_minutes
    
    # Increase the number of employees to ensure all routes are covered
    # Use a smaller divisor to calculate more employees than strictly necessary
    adjusted_required_work_time = REQUIRED_WORK_TIME * 0.9  # Add 10% buffer
    
    morning_employees = math.ceil(total_morning_minutes / adjusted_required_work_time)
    evening_employees = math.ceil(total_evening_minutes / adjusted_required_work_time)
    return morning_employees, evening_employees, routes

def assign_employees(routes, employees, max_retries=3):
    # Try multiple assignment strategies if needed
    for retry in range(max_retries):
        schedule, morning_assigned, morning_total, evening_assigned, evening_total = try_assign_employees(
            routes, employees, retry_strategy=retry
        )
        
        # If we've achieved full assignment, return the results
        if morning_assigned == morning_total and evening_assigned == evening_total:
            print(f"Full assignment achieved on attempt {retry+1}")
            return schedule, morning_assigned, morning_total, evening_assigned, evening_total
    
    # If we've tried all strategies and still haven't fully assigned, return the best result
    print(f"Could not achieve full assignment after {max_retries} attempts")
    return schedule, morning_assigned, morning_total, evening_assigned, evening_total

def try_assign_employees(routes, employees, retry_strategy=0):
    schedule = {emp.emp_id: {"name": emp.name, "routes": []} for emp in employees}
    morning_employees = [e for e in employees if e.shift == "morning"]
    evening_employees = [e for e in employees if e.shift == "evening"]
    
    # Create a list of all departure times
    all_departures = []
    
    # Track which departures have already been assigned
    assigned_departures = set()
    
    for route in routes:
        for departure_time in route.schedule:
            dt = datetime.strptime(departure_time, "%H:%M")
            
            # Create a unique identifier for this route+time combination
            departure_id = f"{route.route_id}_{departure_time}"
            
            # Only add if not already assigned
            if departure_id not in assigned_departures:
                all_departures.append({
                    "route": route,
                    "departure_time": departure_time,
                    "dt": dt,
                    "end_time": dt + timedelta(minutes=route.estimated_time),
                    "duration": route.estimated_time,
                    "departure_id": departure_id,
                    "priority": route.avg_priority  # Add priority for sorting
                })
    
    # Sort all departures based on strategy
    if retry_strategy == 0:
        # Default: Sort by time
        all_departures.sort(key=lambda d: d["dt"])
    elif retry_strategy == 1:
        # Strategy 1: Sort by priority then time
        all_departures.sort(key=lambda d: (-d["priority"], d["dt"]))
    else:
        # Strategy 2: Sort by time but prioritize routes with fewer departures
        route_counts = {}
        for d in all_departures:
            route_id = d["route"].route_id
            if route_id not in route_counts:
                route_counts[route_id] = 0
            route_counts[route_id] += 1
        
        # Add count to each departure
        for d in all_departures:
            d["route_count"] = route_counts[d["route"].route_id]
        
        # Sort by route count (ascending), then time
        all_departures.sort(key=lambda d: (d["route_count"], d["dt"]))
    
    # Split into morning and evening departures
    morning_departures = [d for d in all_departures if MORNING_SHIFT[0] <= d["dt"].hour < MORNING_SHIFT[1]]
    evening_departures = [d for d in all_departures if d not in morning_departures]

    def assign_shift_departures(shift_employees, shift_departures):
        assigned_count = 0
        total_count = len(shift_departures)
        
        # Initialize employee availability
        for emp in shift_employees:
            emp.available_after = datetime.strptime(WORK_START, "%H:%M")
            emp.total_work_time = 0  # Reset work time
        
        # Track route variety per employee
        employee_route_counts = {emp.emp_id: {} for emp in shift_employees}
        
        # First pass: try to assign all departures
        unassigned_departures = []
        for departure in shift_departures:
            assigned_employee = None
            min_score = float('inf')
            
            # Skip if this departure has already been assigned
            if departure["departure_id"] in assigned_departures:
                continue
                
            route_id = departure["route"].route_id
            current_time = departure["dt"]
            
            for emp in shift_employees:
                # Skip if employee is not available yet
                if emp.available_after and current_time < emp.available_after:
                    continue
                
                # Check for schedule conflicts
                has_conflict = False
                for assigned in schedule[emp.emp_id]["routes"]:
                    assigned_start = datetime.strptime(assigned[1], "%H:%M")
                    assigned_end = datetime.strptime(assigned[2], "%H:%M")
                    if not (departure["end_time"] <= assigned_start or current_time >= assigned_end):
                        has_conflict = True
                        break
                
                if not has_conflict:
                    # Calculate score based on work time and route variety
                    route_count = employee_route_counts[emp.emp_id].get(route_id, 0)
                    
                    # Adjust weights based on retry strategy
                    if retry_strategy == 0:
                        work_time_weight = 1.0
                        variety_weight = 2.0
                    elif retry_strategy == 1:
                        work_time_weight = 0.5
                        variety_weight = 1.0  # Reduce variety penalty to assign more routes
                    else:
                        # Focus more on balancing work time
                        work_time_weight = 2.0
                        variety_weight = 0.5
                    
                    work_time_score = (emp.total_work_time / 10) * work_time_weight 
                    variety_score = route_count * 20 * variety_weight
                    
                    # Add a small random factor to break ties
                    random_factor = random.random() * 5
                    
                    total_score = work_time_score + variety_score + random_factor
                    
                    # Prefer employees with lower scores
                    if total_score < min_score:
                        min_score = total_score
                        assigned_employee = emp
            
            if assigned_employee:
                # Update schedule and employee work time
                schedule[assigned_employee.emp_id]["routes"].append((
                    departure["route"].route_id,
                    current_time.strftime("%H:%M"),
                    departure["end_time"].strftime("%H:%M")
                ))
                
                # Update employee availability
                assigned_employee.available_after = departure["end_time"]
                assigned_employee.total_work_time += departure["duration"]
                assigned_count += 1
                
                # Mark this departure as assigned
                assigned_departures.add(departure["departure_id"])
                
                # Update route variety tracking
                if route_id not in employee_route_counts[assigned_employee.emp_id]:
                    employee_route_counts[assigned_employee.emp_id][route_id] = 0
                employee_route_counts[assigned_employee.emp_id][route_id] += 1
            else:
                # If couldn't assign, add to unassigned list for second pass
                unassigned_departures.append(departure)
        
        # Second pass: try to assign remaining departures with more relaxed constraints
        if unassigned_departures:
            print(f"Attempting to assign {len(unassigned_departures)} unassigned departures in second pass")
            
            # Sort unassigned departures by time
            unassigned_departures.sort(key=lambda d: d["dt"])
            
            for departure in unassigned_departures:
                # Skip if this departure has already been assigned
                if departure["departure_id"] in assigned_departures:
                    continue
                    
                route_id = departure["route"].route_id
                current_time = departure["dt"]
                
                # Find employee with least work time
                available_employees = sorted(shift_employees, key=lambda e: e.total_work_time)
                
                for emp in available_employees:
                    # Check for schedule conflicts
                    has_conflict = False
                    for assigned in schedule[emp.emp_id]["routes"]:
                        assigned_start = datetime.strptime(assigned[1], "%H:%M")
                        assigned_end = datetime.strptime(assigned[2], "%H:%M")
                        if not (departure["end_time"] <= assigned_start or current_time >= assigned_end):
                            has_conflict = True
                            break
                    
                    if not has_conflict:
                        # Assign to this employee
                        schedule[emp.emp_id]["routes"].append((
                            departure["route"].route_id,
                            current_time.strftime("%H:%M"),
                            departure["end_time"].strftime("%H:%M")
                        ))
                        
                        # Update employee work time
                        emp.total_work_time += departure["duration"]
                        assigned_count += 1
                        
                        # Mark this departure as assigned
                        assigned_departures.add(departure["departure_id"])
                        
                        # Update route variety tracking
                        if route_id not in employee_route_counts[emp.emp_id]:
                            employee_route_counts[emp.emp_id][route_id] = 0
                        employee_route_counts[emp.emp_id][route_id] += 1
                        
                        break
        
        return assigned_count, total_count

    morning_assigned, morning_total = assign_shift_departures(morning_employees, morning_departures)
    evening_assigned, evening_total = assign_shift_departures(evening_employees, evening_departures)

    # Sort each employee's routes by start time
    for emp_id in schedule:
        schedule[emp_id]["routes"].sort(key=lambda r: datetime.strptime(r[1], "%H:%M"))
    
    return schedule, morning_assigned, morning_total, evening_assigned, evening_total

def display_route_schedules(routes, schedule):
    """Display the schedule for each route with assigned employees"""
    route_schedules = {}
    
    # Initialize route_schedules dictionary
    for route in routes:
        route_schedules[route.route_id] = {}
    
    # Populate route schedules from employee assignments
    for emp_id, data in schedule.items():
        employee_name = data["name"]
        for route_id, start_time, end_time in data["routes"]:
            if start_time not in route_schedules[route_id]:
                route_schedules[route_id][start_time] = []
            route_schedules[route_id][start_time].append((end_time, employee_name, emp_id))
    
    # Display each route's schedule
    print("\n===== ROUTE SCHEDULES =====")
    for route in routes:
        route_id = route.route_id
        print(f"\nRoute {route_id} Schedule (Priority: {route.avg_priority}, Frequency: {route.frequency} minutes):")
        print(f"{'Start Time':<10} {'End Time':<10} {'Employee':<15} {'ID':<6}")
        print("-" * 45)
        
        # Get sorted list of departure times
        departure_times = sorted(route_schedules[route_id].keys(), key=lambda x: datetime.strptime(x, "%H:%M"))
        
        for start_time in departure_times:
            # There should only be one employee per route per departure time
            if route_schedules[route_id][start_time]:
                end_time, employee_name, emp_id = route_schedules[route_id][start_time][0]
                print(f"{start_time:<10} {end_time:<10} {employee_name:<15} {emp_id:<6}")
        
        # Count total scheduled departures
        total_scheduled_departures = len(route.schedule)
        covered_departures = len(route_schedules[route_id])
        
        print(f"\nScheduled departures: {total_scheduled_departures}")
        print(f"Covered departures: {covered_departures}")
        
        # Calculate departure coverage percentage
        departure_coverage = (covered_departures / total_scheduled_departures) * 100 if total_scheduled_departures > 0 else 0
        print(f"Departure coverage: {departure_coverage:.1f}% ({covered_departures}/{total_scheduled_departures} departures)")

# Example Routes and Employees with varying priorities
routes = [
    Route("R1", 40, 12, 10),   # Highest priority route (10/10) - every 10 minutes
    Route("R2", 40, 18, 5),    # Medium priority route (5/10) - every 25 minutes
    Route("R3", 30, 8, 1)      # Lowest priority route (1/10) - every 40 minutes
]

# Print frequency for each route
print("Route Frequencies:")
for route in routes:
    print(f"Route {route.route_id} (Priority {route.avg_priority}): Every {route.frequency} minutes")

# Calculate required employees and generate schedule
morning_emp, evening_emp, routes_with_schedule = calculate_required_employees(routes)


print(f"Adjusted required employees: Morning: {morning_emp}, Evening: {evening_emp}")

employees = [Employee(f"E{i+1}", f"Employee {i+1}", "morning" if i < morning_emp else "evening") for i in range(morning_emp + evening_emp)]
schedule, morning_assigned, morning_total, evening_assigned, evening_total = assign_employees(routes_with_schedule, employees)

# Display route schedules
display_route_schedules(routes_with_schedule, schedule)

# Output statistics
print("\n===== ASSIGNMENT STATISTICS =====")
print(f"Total Morning Routes: {morning_total}, Assigned: {morning_assigned}")
print(f"Total Evening Routes: {evening_total}, Assigned: {evening_assigned}")
print(f"Total Required Employees: Morning: {morning_emp}, Evening: {evening_emp}")

# Check if all routes are assigned
all_assigned = (morning_assigned == morning_total) and (evening_assigned == evening_total)
print(f"\nAll routes assigned: {'Yes' if all_assigned else 'No'}")
if not all_assigned:
    print("Routes not fully assigned. Consider adding more employees or adjusting scheduling parameters.")

# Save detailed output to a file
output_file = "schedule_output.txt"

with open(output_file, "w") as f:
    # Write route information
    f.write("Route Information:\n")
    for route in routes:
        f.write(f"Route {route.route_id}: Priority {route.avg_priority}, Frequency every {route.frequency} minutes\n")
        f.write(f"  Total scheduled departures: {len(route.schedule)}\n")
    f.write("\n")
    
    # Write schedule statistics
    f.write(f"Total Morning Routes: {morning_total}, Assigned: {morning_assigned}\n")
    f.write(f"Total Evening Routes: {evening_total}, Assigned: {evening_assigned}\n\n")
    
    # Write employee schedules
    for emp_id, data in schedule.items():
        f.write(f"\nEmployee: {data['name']} ({emp_id}) - {next(e.shift for e in employees if e.emp_id == emp_id)} shift\n")
        
        # Count route distribution
        route_counts = {}
        for r in data['routes']:
            if r[0] not in route_counts:
                route_counts[r[0]] = 0
            route_counts[r[0]] += 1
        
        # Print route distribution
        f.write("  Route distribution: ")
        for r_id, count in route_counts.items():
            f.write(f"{r_id}({count}) ")
        f.write("\n")
        
        # Print detailed schedule
        for r in data['routes']:
            f.write(f"  Route {r[0]}: {r[1]} - {r[2]}\n")
        
        total_minutes = sum((datetime.strptime(r[2], "%H:%M") - datetime.strptime(r[1], "%H:%M")).seconds // 60 for r in data['routes'])
        f.write(f"  Total work time: {total_minutes // 60} hours {total_minutes % 60} minutes\n")

print(f"\nDetailed output saved to {output_file}")