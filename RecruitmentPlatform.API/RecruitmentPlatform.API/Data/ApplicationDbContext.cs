using Microsoft.EntityFrameworkCore;
using RecruitmentPlatform.API.Models;

namespace RecruitmentPlatform.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Candidate> Candidates { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<Application> Applications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Ensure email is unique
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Job → User (Recruiter) relationship
            modelBuilder.Entity<Job>()
                .HasOne(j => j.PostedByUser)
                .WithMany(u => u.Jobs) 
                .HasForeignKey(j => j.PostedByUserId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent deleting a user who posted jobs

            // Job → Application (one-to-many)
            modelBuilder.Entity<Application>()
                .HasOne(a => a.Job)
                .WithMany(j => j.Applications)
                .HasForeignKey(a => a.JobId)
                .OnDelete(DeleteBehavior.Cascade); // If a job is deleted, all applications are deleted

            // Candidate → Application (one-to-many)
            modelBuilder.Entity<Application>()
                .HasOne(a => a.Candidate)
                .WithMany(c => c.Applications) 
                .HasForeignKey(a => a.CandidateId)
                .OnDelete(DeleteBehavior.Cascade); // If a candidate is deleted, their applications are deleted

            // Ensure Application has a unique constraint (optional)
            modelBuilder.Entity<Application>()
                .HasIndex(a => new { a.JobId, a.CandidateId })
                .IsUnique(); // Prevents duplicate applications for the same job by the same candidate
        }

    }
}