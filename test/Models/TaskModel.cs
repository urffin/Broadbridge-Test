using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace test.Models
{
    [Table("Tasks")]
    public class TaskModel
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public byte Priority { get; set; }
        public DateTime AddedTime { get; set; } = DateTime.Now;
        public DateTime TimeToComplete { get; set; }
        public TaskStatus Status { get; set; } = TaskStatus.Active;
    }
    public enum TaskStatus
    {
        Active = 1,
        Completed = 2
    }
}