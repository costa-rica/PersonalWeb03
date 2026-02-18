"""
PersonalWeb03-Services main entry point.

This script serves as the entry point for all services in the PersonalWeb03-Services project.
Services can be run individually using command-line flags.
"""

import sys
import argparse
import json
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv
from loguru import logger

# Add src directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from utils.config import Config
from utils.guardrail import TimeGuardrail
from utils.logging_config import configure_logging
from services.left_off.onedrive_client import OneDriveClient
from services.left_off.document_parser import DocumentParser
from services.left_off.summarizer import Summarizer
from services.toggl.toggl_client import TogglClient
from services.toggl.time_aggregator import TimeAggregator


def run_left_off_service():
    """
    Run the LEFT-OFF.docx download and summary service.
    
    Returns:
        int: Exit code (0=success, 1=error)
    """
    logger.info("Starting LEFT-OFF service")
    
    try:
        # Load and validate configuration
        config = Config()
        config.validate_left_off_config()
        
        # Step 1: Download LEFT-OFF.docx from OneDrive
        logger.info("Step 1: Downloading LEFT-OFF.docx from OneDrive")
        client = OneDriveClient(
            application_id=config.application_id,
            client_secret=config.client_secret,
            refresh_token=config.refresh_token
        )
        
        # Get access token
        if not client.get_access_token():
            logger.error("Failed to obtain access token")
            return 1
        
        # Download LEFT-OFF.docx file
        output_path = config.get_left_off_file_path()
        if not client.download_file(config.target_file_id, str(output_path)):
            logger.error("Failed to download LEFT-OFF.docx")
            return 1
        
        # Step 2: Parse document and extract last 7 days
        logger.info("Step 2: Parsing document and extracting last 7 days")
        parser = DocumentParser(str(output_path))
        
        if not parser.load_document():
            logger.error("Failed to load document")
            return 1
        
        activities_path = config.get_activities_file_path()
        if not parser.extract_last_7_days(str(activities_path)):
            logger.error("Failed to extract last 7 days")
            return 1
        
        # Step 3: Generate AI-powered summary
        logger.info("Step 3: Generating AI-powered summary")
        template_path = Path(__file__).parent / 'templates' / 'left-off-summarizer.md'
        
        summarizer = Summarizer(
            api_key=config.openai_api_key,
            base_url=config.openai_base_url if config.openai_base_url != 'https://api.openai.com/v1' else None
        )
        
        summary_result = summarizer.generate_summary(
            str(activities_path),
            str(template_path)
        )
        
        if not summary_result:
            logger.error("Failed to generate summary")
            return 1
        
        # Override datetime_summary with current time (West Coast)
        summary_result['datetime_summary'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Save the JSON result to file
        summary_json_path = config.get_summary_json_path()
        try:
            with open(summary_json_path, 'w', encoding='utf-8') as f:
                json.dump(summary_result, f, indent=2)
            logger.info(f"Summary saved to: {summary_json_path}")
        except Exception as e:
            logger.error(f"Failed to save summary to file: {e}")
            return 1
        
        # Print the JSON result
        print("\n" + "="*80)
        print("SUMMARY RESULT:")
        print("="*80)
        print(json.dumps(summary_result, indent=2))
        print("="*80 + "\n")
        
        logger.info("LEFT-OFF service completed successfully")
        return 0
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return 1


def run_toggl_service():
    """
    Run the Toggl Tracker to CSV service.
    
    Returns:
        int: Exit code (0=success, 1=error)
    """
    logger.info("Starting Toggl service")
    
    try:
        # Load and validate configuration
        config = Config()
        config.validate_toggl_config()
        
        # Initialize Toggl client
        client = TogglClient(api_token=config.toggl_api_token)
        
        # Step 1: Get workspaces
        logger.info("Step 1: Fetching workspaces")
        workspaces = client.get_workspaces()
        if not workspaces:
            logger.error("Failed to fetch workspaces")
            return 1
        
        # Use first workspace
        workspace_id = workspaces[0]['id']
        logger.info(f"Using workspace: {workspaces[0]['name']}")
        
        # Step 2: Get projects
        logger.info("Step 2: Fetching projects")
        projects = client.get_projects(workspace_id)
        if projects is None:
            logger.error("Failed to fetch projects")
            return 1
        
        # Step 3: Get time entries for last 7 days
        logger.info("Step 3: Fetching time entries for last 7 days")
        # end_date is exclusive in Toggl API, so we add 1 day to include today
        end_date = datetime.now() + timedelta(days=1)
        start_date = end_date - timedelta(days=7)
        
        time_entries = client.get_time_entries(start_date, end_date)
        if time_entries is None:
            logger.error("Failed to fetch time entries")
            return 1
        
        # Step 4: Aggregate time by project
        logger.info("Step 4: Aggregating time by project")
        aggregator = TimeAggregator()
        results = aggregator.aggregate_by_project(time_entries, projects)
        
        # Step 5: Print results
        print("\n" + "="*80)
        print("TOGGL TIME ENTRIES (Last 7 Days):")
        print("="*80)
        for item in results:
            print(f"{item['project_name']}: {item['hours_worked']} hours")
        print("="*80 + "\n")
        
        # Step 6: Write to CSV
        logger.info("Step 5: Writing results to CSV")
        csv_path = config.get_toggl_csv_path()
        collection_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        try:
            import csv
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['project_name', 'hours_worked', 'datetime_collected'])
                writer.writeheader()
                
                for item in results:
                    writer.writerow({
                        'project_name': item['project_name'],
                        'hours_worked': item['hours_worked'],
                        'datetime_collected': collection_time
                    })
            
            logger.info(f"CSV saved to: {csv_path}")
        except Exception as e:
            logger.error(f"Failed to write CSV: {e}")
            return 1
        
        logger.info("Toggl service completed successfully")
        return 0
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return 1


def main():
    """Main entry point for the application."""
    # Load environment variables from .env file
    load_dotenv()

    # Configure logging
    configure_logging()

    parser = argparse.ArgumentParser(
        description='PersonalWeb03-Services - Run various services for PersonalWeb03'
    )
    
    parser.add_argument(
        '--run-left-off',
        action='store_true',
        help='Run only the LEFT-OFF.docx download and summary service'
    )
    
    parser.add_argument(
        '--run-toggl',
        action='store_true',
        help='Run only the Toggl Tracker to CSV service'
    )
    
    parser.add_argument(
        '--run-anyway',
        action='store_true',
        help='Bypass time window restrictions and run services at any time'
    )
    
    args = parser.parse_args()
    
    # Run individual services (bypass guardrail)
    if args.run_left_off:
        exit_code = run_left_off_service()
        sys.exit(exit_code)
    elif args.run_toggl:
        exit_code = run_toggl_service()
        sys.exit(exit_code)
    
    # No individual service flag - run both services with guardrail check
    logger.info("Running both services")
    
    # Check time guardrail unless --run-anyway is specified
    config = Config()
    exit_code = TimeGuardrail.enforce(bypass=args.run_anyway, start_time_str=config.time_window_start)
    if exit_code != 0:
        sys.exit(exit_code)
    
    # Run both services
    logger.info("Time window check passed - executing both services")
    
    # Run LEFT-OFF service
    exit_code = run_left_off_service()
    if exit_code != 0:
        logger.error("LEFT-OFF service failed, skipping Toggl service")
        sys.exit(exit_code)
    
    # Run Toggl service
    exit_code = run_toggl_service()
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
