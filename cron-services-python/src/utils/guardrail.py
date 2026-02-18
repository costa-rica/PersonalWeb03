"""
Time-based guardrail for controlling service execution.
"""

from datetime import datetime
from loguru import logger


class TimeGuardrail:
    """Enforces time-based execution windows for services."""
    
    # Default window settings if not configured
    DEFAULT_START_TIME = "23:00"  # 11:00 PM
    WINDOW_DURATION_MINUTES = 10  # 10 minute window
    
    @classmethod
    def parse_time_window(cls, start_time_str):
        """
        Parse start time string and calculate end time.
        
        Args:
            start_time_str: Time in HH:MM format (24-hour)
            
        Returns:
            tuple: (start_hour, start_minute, end_hour, end_minute)
        """
        try:
            hour, minute = map(int, start_time_str.split(':'))
            
            # Validate hour and minute
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                raise ValueError("Invalid time format")
            
            # Calculate end time (add 10 minutes)
            end_minute = minute + cls.WINDOW_DURATION_MINUTES
            end_hour = hour
            
            # Handle minute overflow
            if end_minute >= 60:
                end_minute -= 60
                end_hour += 1
                
            # Handle hour overflow (crosses midnight)
            if end_hour >= 24:
                end_hour -= 24
            
            return hour, minute, end_hour, end_minute
            
        except (ValueError, AttributeError):
            logger.error(f"Invalid TIME_WINDOW_START format: {start_time_str}. Use HH:MM format (e.g., '23:00')")
            return None
    
    @classmethod
    def check_time_window(cls, start_time_str=None):
        """
        Check if current time is within the allowed execution window.
        
        Args:
            start_time_str: Optional start time override (HH:MM format)
        
        Returns:
            bool: True if within allowed window, False otherwise
        """
        if start_time_str is None:
            start_time_str = cls.DEFAULT_START_TIME
        
        # Parse time window
        parsed = cls.parse_time_window(start_time_str)
        if parsed is None:
            return False
        
        start_hour, start_minute, end_hour, end_minute = parsed
        
        now = datetime.now()
        current_hour = now.hour
        current_minute = now.minute
        
        # Check if current time is within window
        # Convert times to minutes since midnight for easier comparison
        current_total_minutes = current_hour * 60 + current_minute
        start_total_minutes = start_hour * 60 + start_minute
        end_total_minutes = end_hour * 60 + end_minute
        
        # Handle case where window crosses midnight
        if end_total_minutes < start_total_minutes:
            # Window crosses midnight (e.g., 23:55 - 00:05)
            in_window = current_total_minutes >= start_total_minutes or current_total_minutes <= end_total_minutes
        else:
            # Normal case
            in_window = start_total_minutes <= current_total_minutes <= end_total_minutes
        
        if in_window:
            logger.info("Time window check passed")
            return True
        else:
            logger.warning(
                f"Execution blocked: Current time is {now.strftime('%H:%M:%S')}. "
                f"Services can only run between {start_hour:02d}:{start_minute:02d} and {end_hour:02d}:{end_minute:02d}."
            )
            logger.warning(f"Current time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
            logger.warning(f"Allowed window: {start_hour:02d}:{start_minute:02d} - {end_hour:02d}:{end_minute:02d} (daily)")
            return False
    
    @classmethod
    def enforce(cls, bypass=False, start_time_str=None):
        """
        Enforce the time guardrail.
        
        Args:
            bypass: If True, bypass the time check
            start_time_str: Optional start time override (HH:MM format)
            
        Returns:
            int: 0 if allowed to proceed, 2 if blocked by time restriction
        """
        if bypass:
            logger.info("Time guardrail bypassed with --run-anyway flag")
            return 0
        
        if not cls.check_time_window(start_time_str):
            logger.error("Exiting due to time window restriction (exit code 2)")
            logger.info("Use --run-anyway flag to bypass time restrictions")
            return 2
        
        return 0
