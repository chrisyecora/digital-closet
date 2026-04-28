import sys
from ml_worker import Worker

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run the ML Worker")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (no database writes)")
    args = parser.parse_args()
    
    print("Starting ML Worker...")
    worker = Worker()
    worker.run(once=args.once, dry_run=args.dry_run)
